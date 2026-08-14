using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using BookKaroo.Application.DTOs.Lys;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Application.Services;

public class LysEventService : ILysEventService
{
    private readonly ILysEventRepository    _events;
    private readonly ILysOrganizerRepository _organizers;
    private readonly ILysImageUploadService _imageUpload;
    private readonly ISettingRepository     _settings;
    private readonly IEmailService          _email;
    private readonly IConfiguration         _config;
    private readonly ILogger<LysEventService> _logger;

    public LysEventService(
        ILysEventRepository     events,
        ILysOrganizerRepository  organizers,
        ILysImageUploadService  imageUpload,
        ISettingRepository      settings,
        IEmailService           email,
        IConfiguration          config,
        ILogger<LysEventService> logger)
    {
        _events     = events;
        _organizers = organizers;
        _imageUpload = imageUpload;
        _settings   = settings;
        _email      = email;
        _config     = config;
        _logger     = logger;
    }

    public async Task<LysEventResponse> CreateDraftAsync(
        Guid organizerId, CreateLysEventRequest req, CancellationToken ct = default)
    {
        var commissionStr  = await _settings.GetAsync("lys_commission_rate", ct) ?? "5.0";
        var commissionRate = decimal.TryParse(commissionStr, out var rate) ? rate : 5.0m;

        var baseSlug = GenerateSlug(req.Title);
        var slug     = await EnsureUniqueSlug(baseSlug, null, organizerId, ct);

        var ev = new LysEvent
        {
            OrganizerId        = organizerId,
            Title              = req.Title.Trim(),
            Slug               = slug,
            Type               = req.Type,
            Description        = req.Description.Trim(),
            VenueType          = req.VenueType,
            VenueId             = req.VenueId,
            CustomVenueName     = req.CustomVenueName?.Trim(),
            CustomVenueAddress  = req.CustomVenueAddress?.Trim(),
            CustomVenueCity     = req.CustomVenueCity?.Trim(),
            CustomVenueLatitude  = req.CustomVenueLatitude,
            CustomVenueLongitude = req.CustomVenueLongitude,
            EventDate          = req.EventDate,
            DurationMin        = req.DurationMin,
            Language           = req.Language,
            AgeRestriction     = req.AgeRestriction,
            ArtistsJson        = req.ArtistsJson,
            PriceTiersJson     = req.PriceTiersJson,
            Status             = LysEventStatus.Draft,
            CommissionRate     = commissionRate,
        };

        await _events.AddAsync(ev, ct);
        return MapToResponse(ev);
    }

    public async Task<LysEventResponse> UpdateDraftAsync(
        Guid organizerId, Guid eventId, UpdateLysEventRequest req, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Event not found.");

        if (ev.OrganizerId != organizerId) throw new ForbiddenException("Access denied.");

        if (ev.Status != LysEventStatus.Draft && ev.Status != LysEventStatus.ChangesRequested)
            throw new AppException("Only draft or changes-requested events can be edited.");

        if (!string.IsNullOrWhiteSpace(req.Title))        ev.Title              = req.Title.Trim();
        if (!string.IsNullOrWhiteSpace(req.Type))         ev.Type               = req.Type;
        if (!string.IsNullOrWhiteSpace(req.Description))  ev.Description        = req.Description.Trim();
        if (req.VenueType != null)                         ev.VenueType          = req.VenueType;
        if (req.VenueId.HasValue)                          ev.VenueId            = req.VenueId;
        if (req.CustomVenueName != null)                   ev.CustomVenueName     = req.CustomVenueName.Trim();
        if (req.CustomVenueAddress != null)                ev.CustomVenueAddress  = req.CustomVenueAddress.Trim();
        if (req.CustomVenueCity != null)                   ev.CustomVenueCity     = req.CustomVenueCity.Trim();
        if (req.CustomVenueLatitude.HasValue)              ev.CustomVenueLatitude  = req.CustomVenueLatitude;
        if (req.CustomVenueLongitude.HasValue)             ev.CustomVenueLongitude = req.CustomVenueLongitude;
        if (req.EventDate.HasValue)                        ev.EventDate          = req.EventDate.Value;
        if (req.DurationMin.HasValue)                      ev.DurationMin        = req.DurationMin;
        if (!string.IsNullOrWhiteSpace(req.Language))     ev.Language           = req.Language;
        if (req.AgeRestriction.HasValue)                   ev.AgeRestriction     = req.AgeRestriction.Value;
        if (req.ArtistsJson != null)                       ev.ArtistsJson        = req.ArtistsJson;
        if (req.PriceTiersJson != null)                    ev.PriceTiersJson     = req.PriceTiersJson;

        await _events.UpdateAsync(ev, ct);
        return MapToResponse(ev);
    }

    public async Task<LysEventResponse> SubmitForReviewAsync(
        Guid organizerId, Guid eventId, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Event not found.");

        if (ev.OrganizerId != organizerId) throw new ForbiddenException("Access denied.");

        if (ev.Status != LysEventStatus.Draft && ev.Status != LysEventStatus.ChangesRequested)
            throw new AppException("Only draft or changes-requested events can be submitted.");

        ValidateForSubmission(ev);

        ev.Status      = LysEventStatus.Submitted;
        ev.SubmittedAt = DateTime.UtcNow;

        // Clear partner review so the partner sees the resubmission as a fresh pending item
        ev.PartnerAction      = null;
        ev.PartnerReviewNotes = null;
        ev.PartnerReviewedAt  = null;
        ev.PartnerReviewedBy  = null;

        // Detect active partner for an existing-venue event
        if (ev.VenueType == "existing" && ev.VenueId.HasValue)
        {
            var (hasPartner, partnerId, partnerEmail, partnerName) =
                await _events.DetectVenuePartnerAsync(ev.VenueId.Value, ct);

            if (hasPartner)
            {
                ev.RequiresPartnerApproval = true;
                ev.AssignedPartnerId       = partnerId;
            }
        }

        await _events.UpdateAsync(ev, ct);

        var organizer  = await _organizers.GetByIdAsync(organizerId, ct);
        var adminEmail = _config["ADMIN_EMAIL"] ?? "admin@bookkaroo.com";
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";

        _ = Task.Run(async () =>
        {
            try
            {
                // Notify admin
                await _email.SendLysSubmissionToAdminAsync(
                    adminEmail, organizer?.Name ?? "Organizer",
                    ev.Title, ev.Type, ev.EventDate);

                // If partner is assigned, also notify them
                if (ev.RequiresPartnerApproval)
                {
                    var (_, _, partnerEmail, partnerName) =
                        await _events.DetectVenuePartnerAsync(ev.VenueId!.Value, default);
                    if (!string.IsNullOrEmpty(partnerEmail))
                    {
                        await _email.SendLysPartnerApprovalRequestAsync(
                            partnerEmail, partnerName ?? "Partner",
                            ev.Title, ev.Id, organizer?.Name ?? "Organizer",
                            frontendUrl);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LYS submission notification failed for event {Id}", ev.Id);
            }
        }, ct);

        return MapToResponse(ev);
    }

    public async Task DeleteDraftAsync(Guid organizerId, Guid eventId, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Event not found.");

        if (ev.OrganizerId != organizerId) throw new ForbiddenException("Access denied.");
        if (ev.Status != LysEventStatus.Draft)
            throw new AppException("Only draft events can be deleted.");

        await _events.SoftDeleteAsync(eventId, ct);
    }

    public async Task<LysEventResponse> GetByIdAsync(Guid organizerId, Guid eventId, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(eventId, ct)
            ?? throw new NotFoundException("Event not found.");
        if (ev.OrganizerId != organizerId) throw new ForbiddenException("Access denied.");
        return MapToResponse(ev);
    }

    public async Task<(List<LysEventListItem> Items, int Total)> GetMyEventsAsync(
        Guid organizerId, string? status, int page, int pageSize, CancellationToken ct = default)
    {
        var (items, total) = await _events.GetByOrganizerAsync(organizerId, status, page, pageSize, ct);
        return (items.Select(MapToListItem).ToList(), total);
    }

    public async Task<List<LysDuplicateWarning>> CheckDuplicatesAsync(
        Guid organizerId, string title, DateTime date, CancellationToken ct = default)
    {
        var dupes = await _events.CheckDuplicatesAsync(organizerId, title, date, ct);
        return dupes.Select(e => new LysDuplicateWarning
        {
            Id             = e.Id,
            Title          = e.Title,
            EventDateLabel = e.EventDate.ToString("dd MMM yyyy"),
            Status         = e.Status,
        }).ToList();
    }

    public async Task<LysUploadResult> UploadImageAsync(
        Guid organizerId, Guid? eventId, Stream stream,
        string fileName, string mimeType, string imageType, CancellationToken ct = default)
    {
        var result = imageType == "poster"
            ? await _imageUpload.UploadPosterAsync(organizerId, stream, fileName, mimeType, ct)
            : await _imageUpload.UploadBackdropAsync(organizerId, stream, fileName, mimeType, ct);

        if (eventId.HasValue)
        {
            var ev = await _events.GetByIdAsync(eventId.Value, ct);
            if (ev != null && ev.OrganizerId == organizerId)
            {
                if (imageType == "poster")   ev.PosterUrl   = result.PublicUrl;
                else                          ev.BackdropUrl = result.PublicUrl;
                await _events.UpdateAsync(ev, ct);
            }
        }

        return result;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static void ValidateForSubmission(LysEvent ev)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(ev.Title))       errors.Add("Title is required.");
        if (string.IsNullOrWhiteSpace(ev.Description)) errors.Add("Description is required.");
        if (string.IsNullOrWhiteSpace(ev.Type))        errors.Add("Event type is required.");
        if (ev.EventDate < DateTime.UtcNow)             errors.Add("Event date must be in the future.");
        if (string.IsNullOrWhiteSpace(ev.PosterUrl))   errors.Add("Poster image is required before submission.");

        if (!string.IsNullOrWhiteSpace(ev.PriceTiersJson))
        {
            try
            {
                var tiers = JsonSerializer.Deserialize<List<JsonElement>>(ev.PriceTiersJson);
                if (tiers == null || tiers.Count == 0)
                    errors.Add("At least one price tier is required.");
            }
            catch { errors.Add("Price tiers format is invalid."); }
        }
        else
        {
            errors.Add("At least one price tier is required.");
        }

        if (errors.Count > 0)
            throw new AppException(string.Join(" ", errors));
    }

    private async Task<string> EnsureUniqueSlug(
        string baseSlug, Guid? excludeId, Guid organizerId, CancellationToken ct)
    {
        var slug   = baseSlug;
        var suffix = 2;
        while (await _events.SlugExistsAsync(slug, ct))
        {
            slug = $"{baseSlug}-{organizerId.ToString("N")[..4]}-{suffix++}";
        }
        return slug;
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant().Trim();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        return slug.Trim('-');
    }

    private static LysEventResponse MapToResponse(LysEvent ev)
    {
        var tiers = ParseTiers(ev.PriceTiersJson);
        var ist   = ToIst(ev.EventDate);
        return new LysEventResponse
        {
            Id                 = ev.Id,
            OrganizerId        = ev.OrganizerId,
            Title              = ev.Title,
            Slug               = ev.Slug,
            Type               = ev.Type,
            Description        = ev.Description,
            VenueType          = ev.VenueType,
            VenueId            = ev.VenueId,
            CustomVenueName     = ev.CustomVenueName,
            CustomVenueAddress  = ev.CustomVenueAddress,
            CustomVenueCity     = ev.CustomVenueCity,
            CustomVenueLatitude  = ev.CustomVenueLatitude,
            CustomVenueLongitude = ev.CustomVenueLongitude,
            EventDate          = DateTime.SpecifyKind(ev.EventDate, DateTimeKind.Utc),
            EventDateLabel     = ist.ToString("dd MMM yyyy"),
            EventTimeLabel     = ist.ToString("h:mm tt"),
            DurationMin        = ev.DurationMin,
            Language           = ev.Language,
            AgeRestriction     = ev.AgeRestriction,
            Artists            = ParseArtists(ev.ArtistsJson),
            PriceTiers         = tiers,
            LowestPrice        = tiers.Count > 0 ? tiers.Min(t => t.Price) : 0,
            PosterUrl          = ev.PosterUrl,
            BackdropUrl        = ev.BackdropUrl,
            Status             = ev.Status,
            StatusLabel        = GetStatusLabel(ev.Status),
            StatusColor        = GetStatusColor(ev.Status),
            SubmittedAt        = ev.SubmittedAt,
            ReviewedAt         = ev.ReviewedAt,
            ReviewNotes        = ev.ReviewNotes,
            CommissionRate     = ev.CommissionRate,
            PublishedEventId   = ev.PublishedEventId,
            CreatedAt          = ev.CreatedAt,
            UpdatedAt          = ev.UpdatedAt,
        };
    }

    private static DateTime ToIst(DateTime utcDt) =>
        DateTime.SpecifyKind(utcDt, DateTimeKind.Utc).AddMinutes(330);

    private static LysEventListItem MapToListItem(LysEvent ev)
    {
        var tiers = ParseTiers(ev.PriceTiersJson);
        var ist   = ToIst(ev.EventDate);
        return new LysEventListItem
        {
            Id             = ev.Id,
            Title          = ev.Title,
            Slug           = ev.Slug,
            Type           = ev.Type,
            EventDate      = DateTime.SpecifyKind(ev.EventDate, DateTimeKind.Utc),
            EventDateLabel = ist.ToString("dd MMM yyyy"),
            Status         = ev.Status,
            StatusLabel    = GetStatusLabel(ev.Status),
            PosterUrl      = ev.PosterUrl,
            LowestPrice    = tiers.Count > 0 ? tiers.Min(t => t.Price) : 0,
            SubmittedAt    = ev.SubmittedAt,
            ReviewedAt     = ev.ReviewedAt,
            ReviewNotes    = ev.ReviewNotes,
        };
    }

    private static List<LysPriceTierDto> ParseTiers(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<LysPriceTierDto>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
        }
        catch { return []; }
    }

    private static List<LysArtistDto> ParseArtists(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<LysArtistDto>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
        }
        catch { return []; }
    }

    private static string GetStatusLabel(string status) => status switch
    {
        "draft"             => "Draft",
        "submitted"         => "Submitted",

        "rejected"          => "Rejected",
        "changes_requested" => "Changes Needed",
        "published"         => "Live",
        "completed"         => "Completed",
        _                   => status,
    };

    private static string GetStatusColor(string status) => status switch
    {
        "draft"             => "#999999",
        "submitted"         => "#4F46E5",

        "rejected"          => "#E74C3C",
        "changes_requested" => "#F39C12",
        "published"         => "#27AE60",
        "completed"         => "#555555",
        _                   => "#999999",
    };
}
