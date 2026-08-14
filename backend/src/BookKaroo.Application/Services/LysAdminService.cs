using System.Text.Json;
using BookKaroo.Application.DTOs.Lys;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Application.Services;

public class LysAdminService : ILysAdminService
{
    private readonly ILysEventRepository     _events;
    private readonly ILysOrganizerRepository _organizers;
    private readonly IEventRepository        _mainEvents;
    private readonly IVenueRepository        _venues;
    private readonly IPartnerRepository      _partners;
    private readonly IAuditLogService        _audit;
    private readonly IEmailService           _email;
    private readonly IConfiguration         _config;
    private readonly ILogger<LysAdminService> _logger;

    public LysAdminService(
        ILysEventRepository     events,
        ILysOrganizerRepository organizers,
        IEventRepository        mainEvents,
        IVenueRepository        venues,
        IPartnerRepository      partners,
        IAuditLogService        audit,
        IEmailService           email,
        IConfiguration          config,
        ILogger<LysAdminService> logger)
    {
        _events     = events;
        _organizers = organizers;
        _mainEvents = mainEvents;
        _venues     = venues;
        _partners   = partners;
        _audit      = audit;
        _email      = email;
        _config     = config;
        _logger     = logger;
    }

    public async Task<(List<LysEventAdminDto> Items, int Total)> GetSubmissionsAsync(
        string? search, string? status, string? type,
        DateOnly? fromDate, DateOnly? toDate,
        int page, int pageSize, CancellationToken ct = default) =>
        await _events.GetAllAdminAsync(search, status, type, fromDate, toDate, page, pageSize, ct);

    public async Task<LysEventAdminDto> GetSubmissionDetailAsync(Guid eventId, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Submission not found.");
        var organizer = await _organizers.GetByIdAsync(ev.OrganizerId, ct)
            ?? throw new NotFoundException("Organizer not found.");
        Venue? venue = ev.VenueType == "existing" && ev.VenueId.HasValue
            ? await _venues.GetByIdAsync(ev.VenueId.Value, ct)
            : null;
        string? partnerName = null;
        if (ev.AssignedPartnerId.HasValue)
        {
            var partner = await _partners.GetByIdAsync(ev.AssignedPartnerId.Value, ct);
            partnerName = partner?.BusinessName;
        }
        return BuildAdminDto(ev, organizer, venue?.Name, partnerName);
    }

    private static LysEventAdminDto BuildAdminDto(LysEvent ev, LysOrganizer org, string? venueName = null, string? partnerName = null)
    {
        var ist         = DateTime.SpecifyKind(ev.EventDate, DateTimeKind.Utc).AddMinutes(330);
        var opts        = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var priceTiers  = ParseJson<List<LysPriceTierDto>>(ev.PriceTiersJson, opts) ?? [];
        var artists     = ParseJson<List<LysArtistDto>>(ev.ArtistsJson, opts) ?? [];
        var venueDisplay = ev.VenueType == "existing"
            ? (venueName ?? "Registered Venue")
            : ev.CustomVenueName + (ev.CustomVenueCity != null ? ", " + ev.CustomVenueCity : "");

        return new LysEventAdminDto
        {
            Id                  = ev.Id,
            Title               = ev.Title,
            Slug                = ev.Slug,
            Type                = ev.Type,
            Status              = ev.Status,
            OrganizerName       = org.Name,
            OrganizerEmail      = org.Email,
            OrganizerPan        = org.PanNumber,
            IsOrganizerVerified = org.IsVerified,
            VenueType            = ev.VenueType,
            VenueDisplay         = venueDisplay ?? "",
            CustomVenueAddress   = ev.CustomVenueAddress,
            CustomVenueLatitude  = ev.CustomVenueLatitude,
            CustomVenueLongitude = ev.CustomVenueLongitude,
            EventDateLabel      = ist.ToString("dd MMM yyyy"),
            EventTimeLabel      = ist.ToString("h:mm tt"),
            Description         = ev.Description,
            Language            = ev.Language ?? "",
            AgeRestriction      = ev.AgeRestriction,
            DurationMin         = ev.DurationMin,
            CommissionRate      = ev.CommissionRate,
            TierCount           = priceTiers.Count,
            LowestPrice         = priceTiers.Count > 0 ? priceTiers.Min(t => t.Price) : 0,
            PriceTiers          = priceTiers,
            Artists             = artists,
            PosterUrl           = ev.PosterUrl,
            BackdropUrl         = ev.BackdropUrl,
            SubmittedAt              = ev.SubmittedAt,
            ReviewedAt               = ev.ReviewedAt,
            ReviewNotes              = ev.ReviewNotes,
            RequiresPartnerApproval  = ev.RequiresPartnerApproval,
            AssignedPartnerName      = partnerName,
            PartnerAction            = ev.PartnerAction,
            PartnerReviewNotes       = ev.PartnerReviewNotes,
            PartnerReviewedAt        = ev.PartnerReviewedAt,
        };
    }

    private static T? ParseJson<T>(string? json, JsonSerializerOptions opts)
    {
        if (string.IsNullOrWhiteSpace(json)) return default;
        try { return JsonSerializer.Deserialize<T>(json, opts); }
        catch { return default; }
    }

    public async Task<LysEventAdminDto> ApproveEventAsync(Guid eventId, Guid adminId, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Event not found.");

        if (ev.Status is LysEventStatus.Published or LysEventStatus.Completed)
            throw new AppException($"Cannot modify an event with status '{ev.Status}'. The event is already published or completed.");

        var organizer = await _organizers.GetByIdAsync(ev.OrganizerId, ct)
            ?? throw new NotFoundException("Organizer not found.");

        if (!organizer.IsVerified)
            throw new AppException(
                "Organizer must be verified before their events can be approved. Please verify the organizer first.");

        // Parse event type
        var eventType = ParseEventType(ev.Type);

        // If there is a previously soft-deleted main event (from a prior unpublish), restore it.
        // This avoids a unique-slug constraint violation when re-publishing the same LYS event.
        // We search by PublishedEventId when available (new flow), or fall back to slug (old flow
        // where UnpublishEventAsync had already nulled PublishedEventId).
        Event mainEvent;
        var existingMain = await _mainEvents.FindSoftDeletedByIdOrSlugAsync(ev.PublishedEventId, ev.Slug, ct);

        if (existingMain != null)
        {
            existingMain.Title          = ev.Title;
            existingMain.Type           = eventType;
            existingMain.Description    = ev.Description;
            existingMain.VenueId        = ev.VenueType == "existing" ? ev.VenueId : null;
            existingMain.VenueName      = ev.VenueType == "custom" ? ev.CustomVenueName  : null;
            existingMain.CityName       = ev.VenueType == "custom" ? ev.CustomVenueCity  : null;
            existingMain.VenueLatitude  = ev.VenueType == "custom" ? ev.CustomVenueLatitude  : null;
            existingMain.VenueLongitude = ev.VenueType == "custom" ? ev.CustomVenueLongitude : null;
            existingMain.EventDate      = ev.EventDate;
            existingMain.DurationMin    = ev.DurationMin ?? 0;
            existingMain.Language       = ev.Language;
            existingMain.AgeRestriction = ev.AgeRestriction;
            existingMain.Organizer      = System.Text.Json.JsonSerializer.Serialize(new { name = organizer.Name, contact = organizer.Email });
            existingMain.Artists        = ev.ArtistsJson;
            existingMain.PosterUrl      = ev.PosterUrl;
            existingMain.BackdropUrl    = ev.BackdropUrl;
            existingMain.PriceTiers     = ev.PriceTiersJson;
            existingMain.Status         = MovieStatus.Published;
            existingMain.DeletedAt      = null;
            await _mainEvents.UpdateAsync(existingMain, ct);
            mainEvent = existingMain;
        }
        else
        {
            mainEvent = new Event
            {
                Title          = ev.Title,
                Slug           = ev.Slug,
                Type           = eventType,
                Description    = ev.Description,
                VenueId        = ev.VenueType == "existing" ? ev.VenueId : null,
                VenueName      = ev.VenueType == "custom" ? ev.CustomVenueName  : null,
                CityName       = ev.VenueType == "custom" ? ev.CustomVenueCity  : null,
                VenueLatitude  = ev.VenueType == "custom" ? ev.CustomVenueLatitude  : null,
                VenueLongitude = ev.VenueType == "custom" ? ev.CustomVenueLongitude : null,
                EventDate      = ev.EventDate,
                DurationMin    = ev.DurationMin ?? 0,
                Language       = ev.Language,
                AgeRestriction = ev.AgeRestriction,
                Organizer      = System.Text.Json.JsonSerializer.Serialize(new { name = organizer.Name, contact = organizer.Email }),
                Artists        = ev.ArtistsJson,
                PosterUrl      = ev.PosterUrl,
                BackdropUrl    = ev.BackdropUrl,
                PriceTiers     = ev.PriceTiersJson,
                Status         = MovieStatus.Published,
            };
            await _mainEvents.AddAsync(mainEvent, ct);
        }

        ev.Status          = LysEventStatus.Published;
        ev.ReviewedAt      = DateTime.UtcNow;
        ev.ReviewedBy      = adminId;
        ev.PublishedEventId = mainEvent.Id;
        await _events.UpdateAsync(ev, ct);

        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        _ = Task.Run(async () =>
        {
            try
            {
                await _email.SendLysApprovedAsync(organizer.Email, organizer.Name, ev.Title, ev.Slug, frontendUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LYS approval email failed for event {Id}", ev.Id);
            }
        }, ct);

        await _audit.LogAsync(adminId, "lys_approve", "lys_event", ev.Id, null, new { ev.Status }, null, ct);

        return await GetSubmissionDetailAsync(eventId, ct);
    }

    public async Task<LysEventAdminDto> RejectEventAsync(
        Guid eventId, Guid adminId, string reason, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Event not found.");

        if (ev.Status is LysEventStatus.Published or LysEventStatus.Completed)
            throw new AppException($"Cannot modify an event with status '{ev.Status}'. The event is already published or completed.");

        ev.Status      = LysEventStatus.Rejected;
        ev.ReviewedAt  = DateTime.UtcNow;
        ev.ReviewedBy  = adminId;
        ev.ReviewNotes = reason;
        await _events.UpdateAsync(ev, ct);

        var organizer = await _organizers.GetByIdAsync(ev.OrganizerId, ct);
        _ = Task.Run(async () =>
        {
            try
            {
                if (organizer != null)
                    await _email.SendLysRejectedAsync(organizer.Email, organizer.Name, ev.Title, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LYS rejection email failed for event {Id}", ev.Id);
            }
        }, ct);

        await _audit.LogAsync(adminId, "lys_reject", "lys_event", ev.Id, null, new { ev.Status, reason }, null, ct);

        return await GetSubmissionDetailAsync(eventId, ct);
    }

    public async Task<LysEventAdminDto> RequestChangesAsync(
        Guid eventId, Guid adminId, string notes, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Event not found.");

        if (ev.Status is LysEventStatus.Published or LysEventStatus.Completed)
            throw new AppException($"Cannot modify an event with status '{ev.Status}'. The event is already published or completed.");

        ev.Status      = LysEventStatus.ChangesRequested;
        ev.ReviewedAt  = DateTime.UtcNow;
        ev.ReviewedBy  = adminId;
        ev.ReviewNotes = notes;
        await _events.UpdateAsync(ev, ct);

        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        var organizer   = await _organizers.GetByIdAsync(ev.OrganizerId, ct);
        _ = Task.Run(async () =>
        {
            try
            {
                if (organizer != null)
                    await _email.SendLysChangesRequestedAsync(
                        organizer.Email, organizer.Name, ev.Title, ev.Id, notes, frontendUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LYS changes-requested email failed for event {Id}", ev.Id);
            }
        }, ct);

        await _audit.LogAsync(adminId, "lys_changes_requested", "lys_event", ev.Id, null, new { ev.Status, notes }, null, ct);

        return await GetSubmissionDetailAsync(eventId, ct);
    }

    public async Task<LysEventAdminDto> UnpublishEventAsync(
        Guid eventId, Guid adminId, string reason, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Event not found.");

        if (ev.Status != LysEventStatus.Published)
            throw new AppException("Only published events can be unpublished.");

        // Soft-delete the public-facing event record so it disappears for end users
        if (ev.PublishedEventId.HasValue)
        {
            var mainEvent = await _mainEvents.GetByIdAsync(ev.PublishedEventId.Value, ct);
            if (mainEvent != null)
            {
                mainEvent.DeletedAt = DateTime.UtcNow;
                await _mainEvents.UpdateAsync(mainEvent, ct);
            }
        }

        // Reset LYS event so admin can decide next action (re-approve, reject, or request changes).
        // PublishedEventId is intentionally kept so ApproveEventAsync can restore the soft-deleted
        // main event and avoid a slug uniqueness conflict on re-publish.
        ev.Status      = LysEventStatus.Submitted;
        ev.ReviewNotes = reason;
        ev.ReviewedAt  = DateTime.UtcNow;
        ev.ReviewedBy  = adminId;
        await _events.UpdateAsync(ev, ct);

        await _audit.LogAsync(adminId, "lys_unpublish", "lys_event", ev.Id, null, new { reason }, null, ct);

        return await GetSubmissionDetailAsync(eventId, ct);
    }

    public async Task<(List<LysOrganizerAdminDto> Items, int Total)> GetOrganizersAsync(
        string? search, bool? isVerified, int page, int pageSize, CancellationToken ct = default) =>
        await _organizers.GetAllAdminAsync(search, isVerified, page, pageSize, ct);

    public async Task VerifyOrganizerAsync(Guid organizerId, Guid adminId, CancellationToken ct = default)
    {
        var organizer = await _organizers.GetByIdAsync(organizerId, ct)
            ?? throw new NotFoundException("Organizer not found.");

        organizer.IsVerified  = true;
        organizer.VerifiedAt  = DateTime.UtcNow;
        organizer.VerifiedBy  = adminId;
        await _organizers.UpdateAsync(organizer, ct);
        await _audit.LogAsync(adminId, "lys_verify_organizer", "lys_organizer", organizerId, null, null, null, ct);
    }

    public async Task UnverifyOrganizerAsync(Guid organizerId, CancellationToken ct = default)
    {
        var organizer = await _organizers.GetByIdAsync(organizerId, ct)
            ?? throw new NotFoundException("Organizer not found.");

        organizer.IsVerified = false;
        organizer.VerifiedAt = null;
        organizer.VerifiedBy = null;
        await _organizers.UpdateAsync(organizer, ct);
    }

    public async Task DeactivateOrganizerAsync(Guid organizerId, CancellationToken ct = default)
    {
        var organizer = await _organizers.GetByIdAsync(organizerId, ct)
            ?? throw new NotFoundException("Organizer not found.");

        organizer.IsActive = false;
        await _organizers.UpdateAsync(organizer, ct);
    }

    private static EventType ParseEventType(string type) => type.ToLowerInvariant() switch
    {
        "live_event" or "liveevent" => EventType.LiveEvent,
        "play"                      => EventType.Play,
        "sport"                     => EventType.Sport,
        "activity"                  => EventType.Activity,
        "comedy"                    => EventType.Comedy,
        "ipl"                       => EventType.Ipl,
        _                           => EventType.LiveEvent,
    };
}
