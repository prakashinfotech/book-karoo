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

public class LysPartnerService : ILysPartnerService
{
    private readonly ILysEventRepository     _events;
    private readonly ILysOrganizerRepository _organizers;
    private readonly IEventRepository        _mainEvents;
    private readonly IEmailService           _email;
    private readonly IConfiguration         _config;
    private readonly ILogger<LysPartnerService> _logger;

    public LysPartnerService(
        ILysEventRepository      events,
        ILysOrganizerRepository  organizers,
        IEventRepository         mainEvents,
        IEmailService            email,
        IConfiguration          config,
        ILogger<LysPartnerService> logger)
    {
        _events     = events;
        _organizers = organizers;
        _mainEvents = mainEvents;
        _email      = email;
        _config     = config;
        _logger     = logger;
    }

    public async Task<(List<LysPartnerEventDto> Items, int Total)> GetSubmissionsAsync(
        Guid partnerId, List<Guid> venueIds, string? status,
        int page, int pageSize, CancellationToken ct = default)
    {
        var (items, total) = await _events.GetByPartnerAsync(partnerId, venueIds, status, page, pageSize, ct);
        var dtos = new List<LysPartnerEventDto>(items.Count);
        foreach (var ev in items)
        {
            var organizer = await _organizers.GetByIdAsync(ev.OrganizerId, ct);
            dtos.Add(MapToDto(ev, organizer?.Name ?? "", organizer?.Email ?? ""));
        }
        return (dtos, total);
    }

    public async Task<LysPartnerEventDto> GetSubmissionDetailAsync(
        Guid partnerId, List<Guid> venueIds, Guid eventId, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Submission not found.");

        EnsurePartnerAccess(ev, partnerId, venueIds);

        var organizer = await _organizers.GetByIdAsync(ev.OrganizerId, ct);
        return MapToDto(ev, organizer?.Name ?? "", organizer?.Email ?? "");
    }

    public async Task<LysPartnerEventDto> ApproveAsync(
        Guid partnerId, List<Guid> venueIds, Guid eventId, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Submission not found.");

        EnsurePartnerAccess(ev, partnerId, venueIds);

        if (ev.PartnerAction != null)
            throw new AppException("You have already reviewed this submission.");

        var organizer = await _organizers.GetByIdAsync(ev.OrganizerId, ct);

        // Create the published event record — partner approval is final for venue events
        var mainEvent = new Event
        {
            Title          = ev.Title,
            Slug           = ev.Slug,
            Type           = ParseEventType(ev.Type),
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
            Organizer      = System.Text.Json.JsonSerializer.Serialize(new { name = organizer?.Name ?? "", contact = organizer?.Email ?? "" }),
            Artists        = ev.ArtistsJson,
            PosterUrl      = ev.PosterUrl,
            BackdropUrl    = ev.BackdropUrl,
            PriceTiers     = ev.PriceTiersJson,
            Status         = MovieStatus.Published,
        };

        await _mainEvents.AddAsync(mainEvent, ct);

        ev.PartnerAction      = "approved";
        ev.PartnerReviewedAt  = DateTime.UtcNow;
        ev.PartnerReviewedBy  = partnerId;
        ev.Status             = LysEventStatus.Published;
        ev.ReviewedAt         = DateTime.UtcNow;
        ev.ReviewedBy         = partnerId;
        ev.PublishedEventId   = mainEvent.Id;
        await _events.UpdateAsync(ev, ct);

        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        _ = Task.Run(async () =>
        {
            try
            {
                if (organizer != null)
                    await _email.SendLysApprovedAsync(organizer.Email, organizer.Name, ev.Title, ev.Slug, frontendUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LYS partner approval email failed for event {Id}", ev.Id);
            }
        }, ct);

        return MapToDto(ev, organizer?.Name ?? "", organizer?.Email ?? "");
    }

    public async Task<LysPartnerEventDto> RejectAsync(
        Guid partnerId, List<Guid> venueIds, Guid eventId, string reason, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Submission not found.");

        EnsurePartnerAccess(ev, partnerId, venueIds);

        if (ev.PartnerAction != null)
            throw new AppException("You have already reviewed this submission.");

        ev.PartnerAction      = "rejected";
        ev.PartnerReviewNotes = reason;
        ev.PartnerReviewedAt  = DateTime.UtcNow;
        ev.PartnerReviewedBy  = partnerId;
        ev.Status             = "rejected";
        await _events.UpdateAsync(ev, ct);

        var organizer = await _organizers.GetByIdAsync(ev.OrganizerId, ct);
        _ = Task.Run(async () =>
        {
            try
            {
                if (organizer != null)
                    await _email.SendLysPartnerRejectedAsync(organizer.Email, organizer.Name, ev.Title, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LYS partner rejection email failed for event {Id}", ev.Id);
            }
        }, ct);

        return MapToDto(ev, organizer?.Name ?? "", organizer?.Email ?? "");
    }

    public async Task<LysPartnerEventDto> RequestChangesAsync(
        Guid partnerId, List<Guid> venueIds, Guid eventId, string notes, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Submission not found.");

        EnsurePartnerAccess(ev, partnerId, venueIds);

        if (ev.PartnerAction != null)
            throw new AppException("You have already reviewed this submission.");

        ev.PartnerAction      = "changes_requested";
        ev.PartnerReviewNotes = notes;
        ev.PartnerReviewedAt  = DateTime.UtcNow;
        ev.PartnerReviewedBy  = partnerId;
        ev.Status             = LysEventStatus.ChangesRequested;
        await _events.UpdateAsync(ev, ct);

        var organizer   = await _organizers.GetByIdAsync(ev.OrganizerId, ct);
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
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
                _logger.LogError(ex, "LYS partner request-changes email failed for event {Id}", ev.Id);
            }
        }, ct);

        return MapToDto(ev, organizer?.Name ?? "", organizer?.Email ?? "");
    }

    public async Task<int> GetPendingCountAsync(
        Guid partnerId, List<Guid> venueIds, CancellationToken ct = default) =>
        await _events.GetPendingCountForPartnerAsync(partnerId, venueIds, ct);

    // ── Helpers ──────────────────────────────────────────────────────────────

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

    private static void EnsurePartnerAccess(Domain.Entities.LysEvent ev, Guid partnerId, List<Guid> venueIds)
    {
        if (ev.AssignedPartnerId != partnerId)
            throw new ForbiddenException("This submission is not assigned to your account.");
        if (!ev.VenueId.HasValue || !venueIds.Contains(ev.VenueId.Value))
            throw new ForbiddenException("You do not have access to this venue.");
    }

    private static LysPartnerEventDto MapToDto(Domain.Entities.LysEvent ev, string orgName, string orgEmail)
    {
        var ist        = DateTime.SpecifyKind(ev.EventDate, DateTimeKind.Utc).AddMinutes(330);
        var opts       = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var priceTiers = ParseJson<List<LysPriceTierDto>>(ev.PriceTiersJson, opts) ?? [];
        var artists    = ParseJson<List<LysArtistDto>>(ev.ArtistsJson, opts) ?? [];

        return new LysPartnerEventDto
        {
            Id                = ev.Id,
            Title             = ev.Title,
            Slug              = ev.Slug,
            Type              = ev.Type,
            Status            = ev.Status,
            OrganizerName     = orgName,
            OrganizerEmail    = orgEmail,
            VenueDisplay      = ev.CustomVenueName ?? "Registered Venue",
            EventDateLabel    = ist.ToString("dd MMM yyyy"),
            EventTimeLabel    = ist.ToString("h:mm tt"),
            Description       = ev.Description,
            Language          = ev.Language ?? "",
            AgeRestriction    = ev.AgeRestriction,
            DurationMin       = ev.DurationMin,
            TierCount         = priceTiers.Count,
            LowestPrice       = priceTiers.Count > 0 ? priceTiers.Min(t => t.Price) : 0,
            PriceTiers        = priceTiers,
            Artists           = artists,
            PosterUrl         = ev.PosterUrl,
            BackdropUrl       = ev.BackdropUrl,
            SubmittedAt       = ev.SubmittedAt,
            PartnerAction     = ev.PartnerAction,
            PartnerReviewNotes = ev.PartnerReviewNotes,
            PartnerReviewedAt = ev.PartnerReviewedAt,
        };
    }

    private static T? ParseJson<T>(string? json, JsonSerializerOptions opts)
    {
        if (string.IsNullOrWhiteSpace(json)) return default;
        try { return JsonSerializer.Deserialize<T>(json, opts); }
        catch { return default; }
    }
}
