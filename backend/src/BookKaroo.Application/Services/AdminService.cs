using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Application.Services;

public class AdminService : IAdminService
{
    private readonly IMovieRepository    _movies;
    private readonly IEventRepository    _events;
    private readonly IAdminRepository    _adminRepo;
    private readonly IAuditLogService    _audit;
    private readonly ITmdbService        _tmdb;
    private readonly IHttpClientFactory  _http;
    private readonly ILogger<AdminService> _logger;
    private readonly IVenueRepository    _venueRepo;
    private readonly IScreenRepository   _screenRepo;
    private readonly IShowRepository     _showRepo;
    private readonly ICityRepository     _cities;
    private readonly IBookingRepository    _bookings;
    private readonly IUserRepository       _users;
    private readonly IEmailService         _email;
    private readonly ICmsBannerRepository  _bannerRepo;
    private readonly ISettingRepository    _settingRepo;
    private readonly IRemindMeRepository   _remindMes;

    // Keep legacy reference for event form dropdown (uses IRepository<Venue>)
    private readonly IRepository<Venue>  _venues;

    public AdminService(
        IMovieRepository      movies,
        IEventRepository      events,
        IAdminRepository      adminRepo,
        IAuditLogService      audit,
        ITmdbService          tmdb,
        IHttpClientFactory    http,
        ILogger<AdminService> logger,
        IVenueRepository      venueRepo,
        IScreenRepository     screenRepo,
        IShowRepository       showRepo,
        ICityRepository       cities,
        IBookingRepository    bookings,
        IUserRepository       users,
        IEmailService         email,
        ICmsBannerRepository  bannerRepo,
        ISettingRepository    settingRepo,
        IRemindMeRepository   remindMes)
    {
        _movies      = movies;
        _events      = events;
        _adminRepo   = adminRepo;
        _audit       = audit;
        _tmdb        = tmdb;
        _http        = http;
        _logger      = logger;
        _venueRepo   = venueRepo;
        _screenRepo  = screenRepo;
        _bookings    = bookings;
        _users       = users;
        _email       = email;
        _showRepo    = showRepo;
        _cities      = cities;
        _bannerRepo  = bannerRepo;
        _settingRepo = settingRepo;
        _remindMes   = remindMes;
        _venues      = venueRepo; // IVenueRepository extends IRepository<Venue>
    }

    // ── Legacy TMDB poster sync ───────────────────────────────────────────────

    public async Task<int> SyncTmdbPostersAsync(CancellationToken ct = default)
    {
        var (allMovies, _) = await _movies.GetPublishedAsync(null, null, null, null, null, null, 1, 100, ct);
        var moviesWithTmdb = allMovies.Where(m => m.TmdbId.HasValue).ToList();
        int updated = 0;
        var bearer = Environment.GetEnvironmentVariable("TMDB_BEARER");
        if (string.IsNullOrEmpty(bearer) || bearer.StartsWith("placeholder"))
        {
            _logger.LogWarning("TMDB_BEARER not configured — cannot sync posters.");
            return 0;
        }
        var client = _http.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", bearer);
        foreach (var movie in moviesWithTmdb)
        {
            try
            {
                var url = $"https://api.themoviedb.org/3/movie/{movie.TmdbId}?append_to_response=videos";
                var response = await client.GetStringAsync(url, ct);
                var doc = JsonDocument.Parse(response);
                var root = doc.RootElement;
                bool changed = false;
                if (root.TryGetProperty("poster_path", out var poster) && poster.ValueKind != JsonValueKind.Null)
                { movie.PosterUrl = poster.GetString(); changed = true; }
                if (root.TryGetProperty("backdrop_path", out var backdrop) && backdrop.ValueKind != JsonValueKind.Null)
                { movie.BackdropUrl = backdrop.GetString(); changed = true; }
                if (root.TryGetProperty("vote_average", out var rating))
                { movie.ImdbRating = (decimal)rating.GetDouble(); changed = true; }
                if (root.TryGetProperty("videos", out var videos) && videos.TryGetProperty("results", out var results))
                {
                    var trailer = results.EnumerateArray()
                        .FirstOrDefault(v =>
                            v.TryGetProperty("type", out var t) && t.GetString() == "Trailer" &&
                            v.TryGetProperty("site", out var s) && s.GetString() == "YouTube");
                    if (trailer.ValueKind != JsonValueKind.Undefined && trailer.TryGetProperty("key", out var key))
                    { movie.TrailerUrl = $"https://www.youtube.com/watch?v={key.GetString()}"; changed = true; }
                }
                if (changed) { await _movies.UpdateAsync(movie, ct); updated++; }
                await Task.Delay(300, ct);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to sync TMDB data for '{Title}'", movie.Title); }
        }
        return updated;
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public async Task<DashboardResponse> GetDashboardAsync(CancellationToken ct = default)
    {
        var now          = DateTime.UtcNow;
        var todayStart   = now.Date;
        var todayEnd     = todayStart.AddDays(1);
        var weekStart    = todayStart.AddDays(-(int)now.DayOfWeek);
        var monthStart   = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var sevenDaysAgo = todayStart.AddDays(-6);

        var todayBookings  = await _adminRepo.CountTodayBookingsAsync(todayStart, todayEnd, ct);
        var todayRevenue   = await _adminRepo.SumTodayRevenueAsync(todayStart, todayEnd, ct);
        var weekRevenue    = await _adminRepo.SumWeekRevenueAsync(weekStart, ct);
        var monthRevenue   = await _adminRepo.SumMonthRevenueAsync(monthStart, ct);
        var totalUsers     = await _adminRepo.CountTotalUsersAsync(ct);
        var newUsersToday  = await _adminRepo.CountNewUsersTodayAsync(todayStart, todayEnd, ct);
        var topMovie       = await _adminRepo.GetTopMovieThisWeekAsync(weekStart, ct);
        var bookingsPerDay = await _adminRepo.GetBookingsPerDayAsync(sevenDaysAgo, ct);
        var revenuePerCity = await _adminRepo.GetRevenuePerCityAsync(5, ct);
        var recentBookings = await _adminRepo.GetRecentBookingsAsync(10, ct);
        var recentActivity = await _adminRepo.GetRecentActivityAsync(10, ct);

        return new DashboardResponse(
            todayBookings, todayRevenue, weekRevenue, monthRevenue,
            totalUsers, newUsersToday, topMovie,
            bookingsPerDay, revenuePerCity, recentBookings, recentActivity);
    }

    public async Task<AuditLogPagedResponse> GetAuditLogsAsync(
        string? entityType, int page, int pageSize, CancellationToken ct = default)
    {
        var (items, total) = await _adminRepo.GetAuditLogsAsync(entityType, page, pageSize, ct);
        return new AuditLogPagedResponse(
            items, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize));
    }

    // ── Movie CRUD ────────────────────────────────────────────────────────────

    public async Task<AdminMoviePagedResponse> GetMoviesAsync(
        string? search, string? status, string? category,
        int page, int pageSize, CancellationToken ct = default)
    {
        var statusEnum   = ParseEnum<MovieStatus>(status);
        var categoryEnum = ParseEnum<MovieCategory>(category);
        var (items, total) = await _movies.GetAllAdminAsync(search, statusEnum, categoryEnum, page, pageSize, ct);
        var mapped = items.Select(MapMovieResponse).ToList();
        return new AdminMoviePagedResponse(mapped, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize));
    }

    public async Task<AdminMovieDetailResponse> GetMovieByIdAsync(Guid id, CancellationToken ct = default)
    {
        var movie = await _movies.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Movie {id} not found.");
        return MapMovieDetail(movie);
    }

    public async Task<AdminMovieResponse> CreateMovieAsync(CreateMovieRequest req, CancellationToken ct = default)
    {
        var slug = await EnsureUniqueMovieSlug(GenerateSlug(req.Title), null, ct);
        var status   = ParseEnum<MovieStatus>(req.Status)   ?? MovieStatus.Draft;
        var category = ParseEnum<MovieCategory>(req.Category) ?? MovieCategory.NowShowing;

        var movie = new Movie
        {
            Id          = Guid.NewGuid(),
            TmdbId      = req.TmdbId,
            Title       = req.Title,
            Slug        = slug,
            Description = req.Description,
            DurationMin = req.DurationMin,
            Certificate = req.Certificate,
            Languages   = req.Languages ?? [],
            Formats     = req.Formats   ?? [],
            Genres      = req.Genres    ?? [],
            ReleaseDate = ParseDateOnly(req.ReleaseDate),
            PosterUrl   = req.PosterUrl,
            BackdropUrl = req.BackdropUrl,
            TrailerUrl  = req.TrailerUrl,
            ImdbRating  = req.ImdbRating,
            Cast        = req.Cast,
            Crew        = req.Crew,
            Status      = status,
            Category    = category,
        };

        await _movies.AddAsync(movie, ct);
        await _audit.LogAsync(null, "create", "movie", movie.Id, null, new { movie.Title, movie.Status }, null, ct);
        return MapMovieResponse(movie);
    }

    public async Task<AdminMovieResponse> UpdateMovieAsync(Guid id, UpdateMovieRequest req, CancellationToken ct = default)
    {
        var movie = await _movies.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Movie {id} not found.");

        var before              = new { movie.Title, movie.Status, movie.Category };
        var categoryBefore      = movie.Category;

        if (req.Title       != null && req.Title != movie.Title)
        {
            movie.Title = req.Title;
            movie.Slug  = await EnsureUniqueMovieSlug(GenerateSlug(req.Title), id, ct);
        }
        if (req.Description != null) movie.Description = req.Description;
        if (req.DurationMin.HasValue) movie.DurationMin = req.DurationMin.Value;
        if (req.Certificate != null) movie.Certificate = req.Certificate;
        if (req.Languages   != null) movie.Languages   = req.Languages;
        if (req.Formats     != null) movie.Formats     = req.Formats;
        if (req.Genres      != null) movie.Genres      = req.Genres;
        if (req.ReleaseDate != null) movie.ReleaseDate = ParseDateOnly(req.ReleaseDate);
        if (req.PosterUrl   != null) movie.PosterUrl   = req.PosterUrl;
        if (req.BackdropUrl != null) movie.BackdropUrl = req.BackdropUrl;
        if (req.TrailerUrl  != null) movie.TrailerUrl  = req.TrailerUrl;
        if (req.ImdbRating.HasValue) movie.ImdbRating  = req.ImdbRating;
        if (req.Cast        != null) movie.Cast        = req.Cast;
        if (req.Crew        != null) movie.Crew        = req.Crew;
        if (req.Status      != null) movie.Status      = ParseEnum<MovieStatus>(req.Status) ?? movie.Status;
        if (req.Category    != null) movie.Category    = ParseEnum<MovieCategory>(req.Category) ?? movie.Category;

        await _movies.UpdateAsync(movie, ct);
        var after = new { movie.Title, movie.Status, movie.Category };
        await _audit.LogAsync(null, "update", "movie", movie.Id, before, after, null, ct);

        // Notify opted-in users when a movie transitions to Now Showing
        if (categoryBefore != MovieCategory.NowShowing && movie.Category == MovieCategory.NowShowing)
            await NotifyRemindMeUsersAsync(movie, ct);

        return MapMovieResponse(movie);
    }

    private async Task NotifyRemindMeUsersAsync(Movie movie, CancellationToken ct)
    {
        var reminders = (await _remindMes.GetByMovieAsync(movie.Id, ct)).ToList();
        if (reminders.Count == 0) return;

        _logger.LogInformation("Sending Now Showing notifications for {Movie} to {Count} user(s)", movie.Title, reminders.Count);

        foreach (var reminder in reminders)
        {
            var user = await _users.GetByIdAsync(reminder.UserId, ct);
            if (user is null) continue;

            try
            {
                await _email.SendMovieNowShowingAsync(user, movie, ct);
                reminder.Notified = true;
                await _remindMes.UpdateAsync(reminder, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send Now Showing email to {UserId} for {Movie}", reminder.UserId, movie.Title);
            }
        }
    }

    public async Task DeleteMovieAsync(Guid id, CancellationToken ct = default)
    {
        var movie = await _movies.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Movie {id} not found.");
        await _movies.SoftDeleteAsync(id, ct);
        await _audit.LogAsync(null, "delete", "movie", id, new { movie.Title }, null, null, ct);
    }

    public async Task<AdminMovieResponse> SyncFromTmdbAsync(int tmdbId, CancellationToken ct = default)
    {
        var doc = await _tmdb.GetMovieAsync(tmdbId, ct)
            ?? throw new InvalidOperationException($"TMDB returned no data for ID {tmdbId}.");

        var root = doc.RootElement;
        var title = root.GetProperty("title").GetString() ?? "Unknown";

        var existing = await _movies.FindByTmdbIdAsync(tmdbId, ct);
        var isNew = existing is null;
        var movie = existing ?? new Movie { Id = Guid.NewGuid() };

        ApplyTmdbData(movie, root, title);

        if (isNew)
        {
            movie.Slug     = await EnsureUniqueMovieSlug(GenerateSlug(title), null, ct);
            movie.Status   = MovieStatus.Draft;
            movie.Formats  = ["2D"];
            movie.Languages = ["Hindi"];
            await _movies.AddAsync(movie, ct);
            await _audit.LogAsync(null, "create", "movie", movie.Id, null, new { movie.Title, Source = "TMDB" }, null, ct);
        }
        else
        {
            await _movies.UpdateAsync(movie, ct);
            await _audit.LogAsync(null, "update", "movie", movie.Id, null, new { movie.Title, Source = "TMDB" }, null, ct);
        }

        return MapMovieResponse(movie);
    }

    public async Task<ImportPopularResult> ImportPopularAsync(CancellationToken ct = default)
    {
        var doc = await _tmdb.GetPopularAsync(ct);
        if (doc is null) return new ImportPopularResult(0, 0);

        int imported = 0, skipped = 0;

        if (!doc.RootElement.TryGetProperty("results", out var results)) return new ImportPopularResult(0, 0);

        foreach (var item in results.EnumerateArray().Take(20))
        {
            try
            {
                if (!item.TryGetProperty("id", out var idEl)) { skipped++; continue; }
                var tmdbId = idEl.GetInt32();

                var existing = await _movies.FindByTmdbIdAsync(tmdbId, ct);
                if (existing != null) { skipped++; continue; }

                var fullDoc = await _tmdb.GetMovieAsync(tmdbId, ct);
                if (fullDoc is null) { skipped++; continue; }

                var root  = fullDoc.RootElement;
                var title = root.GetProperty("title").GetString() ?? "Unknown";
                var movie = new Movie
                {
                    Id       = Guid.NewGuid(),
                    TmdbId   = tmdbId,
                    Slug     = await EnsureUniqueMovieSlug(GenerateSlug(title), null, ct),
                    Status   = MovieStatus.Draft,
                    Formats  = ["2D"],
                    Languages = ["Hindi"],
                };
                ApplyTmdbData(movie, root, title);
                await _movies.AddAsync(movie, ct);
                imported++;
                await Task.Delay(250, ct);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "ImportPopular: failed for one item"); skipped++; }
        }

        return new ImportPopularResult(imported, skipped);
    }

    // ── Event CRUD ────────────────────────────────────────────────────────────

    public async Task<AdminEventPagedResponse> GetEventsAsync(
        string? search, string? type, string? status,
        int page, int pageSize, CancellationToken ct = default)
    {
        var typeEnum   = ParseEnum<EventType>(type);
        var statusEnum = ParseEnum<MovieStatus>(status);
        var (items, total) = await _events.GetAllAdminAsync(search, typeEnum, statusEnum, page, pageSize, ct);

        var venueIds = items.Where(e => e.VenueId.HasValue).Select(e => e.VenueId!.Value).Distinct().ToList();
        var venueNames = new Dictionary<Guid, string>();
        foreach (var vid in venueIds)
        {
            var v = await _venues.GetByIdAsync(vid, ct);
            if (v != null) venueNames[vid] = v.Name;
        }

        var mapped = items.Select(e => MapEventResponse(e, venueNames)).ToList();
        return new AdminEventPagedResponse(mapped, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize));
    }

    public async Task<AdminEventDetailResponse> GetEventByIdAsync(Guid id, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Event {id} not found.");
        var venueName = ev.VenueId.HasValue
            ? (await _venues.GetByIdAsync(ev.VenueId.Value, ct))?.Name ?? "Unknown"
            : "Unknown";
        return MapEventDetail(ev, venueName);
    }

    public async Task<AdminEventResponse> CreateEventAsync(CreateEventRequest req, CancellationToken ct = default)
    {
        var type   = ParseEnum<EventType>(req.Type)       ?? EventType.LiveEvent;
        var status = ParseEnum<MovieStatus>(req.Status)   ?? MovieStatus.Draft;
        var slug   = await EnsureUniqueEventSlug(GenerateSlug(req.Title), null, ct);

        var ev = new Event
        {
            Id             = Guid.NewGuid(),
            Title          = req.Title,
            Slug           = slug,
            Type           = type,
            Description    = req.Description,
            VenueId        = req.VenueId,
            EventDate      = req.EventDate is null ? null : DateTime.Parse(req.EventDate).ToUniversalTime(),
            DurationMin    = req.DurationMin,
            Language       = req.Language,
            AgeRestriction = req.AgeRestriction,
            Organizer      = req.Organizer,
            Artists        = req.Artists,
            PosterUrl      = req.PosterUrl,
            BackdropUrl    = req.BackdropUrl,
            PriceTiers     = req.PriceTiers,
            Status         = status,
        };

        await _events.AddAsync(ev, ct);
        await _audit.LogAsync(null, "create", "event", ev.Id, null, new { ev.Title, ev.Type }, null, ct);

        var venueName = ev.VenueId.HasValue
            ? (await _venues.GetByIdAsync(ev.VenueId.Value, ct))?.Name ?? "Unknown"
            : "Unknown";
        return MapEventResponse(ev, new Dictionary<Guid, string> { [ev.VenueId ?? Guid.Empty] = venueName });
    }

    public async Task<AdminEventResponse> UpdateEventAsync(Guid id, UpdateEventRequest req, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Event {id} not found.");

        var before = new { ev.Title, ev.Status };

        if (req.Title          != null && req.Title != ev.Title)
        { ev.Title = req.Title; ev.Slug = await EnsureUniqueEventSlug(GenerateSlug(req.Title), id, ct); }
        if (req.Type           != null) ev.Type           = ParseEnum<EventType>(req.Type)     ?? ev.Type;
        if (req.Description    != null) ev.Description    = req.Description;
        if (req.VenueId.HasValue)       ev.VenueId        = req.VenueId;
        if (req.EventDate      != null) ev.EventDate      = DateTime.Parse(req.EventDate).ToUniversalTime();
        if (req.DurationMin.HasValue)   ev.DurationMin    = req.DurationMin.Value;
        if (req.Language       != null) ev.Language       = req.Language;
        if (req.AgeRestriction.HasValue) ev.AgeRestriction = req.AgeRestriction.Value;
        if (req.Organizer      != null) ev.Organizer      = req.Organizer;
        if (req.Artists        != null) ev.Artists        = req.Artists;
        if (req.PosterUrl      != null) ev.PosterUrl      = req.PosterUrl;
        if (req.BackdropUrl    != null) ev.BackdropUrl    = req.BackdropUrl;
        if (req.PriceTiers     != null) ev.PriceTiers     = req.PriceTiers;
        if (req.Status         != null) ev.Status         = ParseEnum<MovieStatus>(req.Status) ?? ev.Status;

        await _events.UpdateAsync(ev, ct);
        await _audit.LogAsync(null, "update", "event", ev.Id, before, new { ev.Title, ev.Status }, null, ct);

        var venueName = ev.VenueId.HasValue
            ? (await _venues.GetByIdAsync(ev.VenueId.Value, ct))?.Name ?? "Unknown"
            : "Unknown";
        return MapEventResponse(ev, new Dictionary<Guid, string> { [ev.VenueId ?? Guid.Empty] = venueName });
    }

    public async Task DeleteEventAsync(Guid id, CancellationToken ct = default)
    {
        var ev = await _events.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Event {id} not found.");
        await _events.SoftDeleteAsync(id, ct);
        await _audit.LogAsync(null, "delete", "event", id, new { ev.Title }, null, null, ct);
    }

    public async Task<IReadOnlyList<AdminVenueItem>> GetVenuesAsync(CancellationToken ct = default)
    {
        var venues = await _venues.GetAllAsync(ct);
        var cityIds = venues.Where(v => v.DeletedAt == null)
                            .Select(v => v.CityId).Distinct().ToList();
        var cityNames = new Dictionary<Guid, string>();
        foreach (var cid in cityIds)
        {
            var city = await _cities.GetByIdAsync(cid, ct);
            if (city != null) cityNames[cid] = city.Name;
        }
        return venues
            .Where(v => v.DeletedAt == null)
            .Select(v => new AdminVenueItem(v.Id, v.Name, cityNames.GetValueOrDefault(v.CityId, "")))
            .OrderBy(v => v.CityName).ThenBy(v => v.Name)
            .ToList();
    }

    // ── Venues CRUD ───────────────────────────────────────────────────────────

    public async Task<AdminVenuePagedResponse> GetVenuesPaginatedAsync(
        string? search, Guid? cityId, string? chain,
        int page, int pageSize, CancellationToken ct = default)
    {
        var (items, total) = await _venueRepo.GetAllAdminAsync(search, cityId, chain, page, pageSize, ct);
        return new AdminVenuePagedResponse(items, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize));
    }

    public async Task<VenueWithScreensDto> GetVenueWithScreensAsync(Guid id, CancellationToken ct = default)
    {
        return await _venueRepo.GetWithScreensAsync(id, ct)
            ?? throw new KeyNotFoundException($"Venue {id} not found.");
    }

    public async Task<VenueAdminDto> CreateVenueAsync(CreateVenueRequest req, CancellationToken ct = default)
    {
        var city = await _cities.GetByIdAsync(req.CityId, ct)
            ?? throw new KeyNotFoundException($"City {req.CityId} not found.");

        var baseSlug = GenerateSlug(req.Name);
        var slug     = await EnsureUniqueVenueSlug(baseSlug, null, ct);

        var amenitiesJson = JsonSerializer.Serialize(req.Amenities ?? []);

        var venue = new Venue
        {
            Id           = Guid.NewGuid(),
            Name         = req.Name,
            Slug         = slug,
            Chain        = req.Chain,
            Address      = req.Address,
            CityId       = req.CityId,
            StateCode    = city.StateCode,
            Latitude     = req.Latitude ?? 0,
            Longitude    = req.Longitude ?? 0,
            Amenities    = amenitiesJson,
            IsActive     = req.IsActive,
            ContactPhone = req.ContactPhone,
            ContactEmail = req.ContactEmail,
        };

        await _venueRepo.AddAsync(venue, ct);
        await _audit.LogAsync(null, "create", "venue", venue.Id, null, new { venue.Name }, null, ct);

        var (items, _) = await _venueRepo.GetAllAdminAsync(null, null, null, 1, 1, ct);
        return items.FirstOrDefault() ??
               new VenueAdminDto(venue.Id, venue.Name, venue.Slug, venue.Chain,
                   venue.Address, venue.CityId, city.Name, city.State, city.StateCode,
                   venue.Latitude, venue.Longitude, req.Amenities ?? [],
                   venue.IsActive, venue.ContactPhone, venue.ContactEmail, 0, venue.CreatedAt);
    }

    public async Task<VenueAdminDto> UpdateVenueAsync(Guid id, UpdateVenueRequest req, CancellationToken ct = default)
    {
        var venue = await _venueRepo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Venue {id} not found.");

        var before = new { venue.Name, venue.IsActive };

        if (req.Name != null && req.Name != venue.Name)
        {
            venue.Name = req.Name;
            venue.Slug = await EnsureUniqueVenueSlug(GenerateSlug(req.Name), id, ct);
        }
        if (req.Chain        != null)    venue.Chain        = req.Chain;
        if (req.Address      != null)    venue.Address      = req.Address;
        if (req.ContactPhone != null)    venue.ContactPhone = req.ContactPhone;
        if (req.ContactEmail != null)    venue.ContactEmail = req.ContactEmail;
        if (req.Latitude.HasValue)       venue.Latitude     = req.Latitude.Value;
        if (req.Longitude.HasValue)      venue.Longitude    = req.Longitude.Value;
        if (req.Amenities    != null)    venue.Amenities    = JsonSerializer.Serialize(req.Amenities);
        if (req.IsActive.HasValue)       venue.IsActive     = req.IsActive.Value;

        if (req.CityId.HasValue && req.CityId.Value != venue.CityId)
        {
            var city = await _cities.GetByIdAsync(req.CityId.Value, ct);
            if (city != null) { venue.CityId = city.Id; venue.StateCode = city.StateCode; }
        }

        await _venueRepo.UpdateAsync(venue, ct);
        await _audit.LogAsync(null, "update", "venue", venue.Id, before, new { venue.Name, venue.IsActive }, null, ct);

        var detail = await _venueRepo.GetWithScreensAsync(id, ct);
        return detail == null
            ? throw new KeyNotFoundException($"Venue {id} not found after update.")
            : new VenueAdminDto(detail.Id, detail.Name, detail.Slug, detail.Chain,
                detail.Address, detail.CityId, detail.CityName, detail.CityState, detail.StateCode,
                detail.Latitude, detail.Longitude, detail.Amenities,
                detail.IsActive, detail.ContactPhone, detail.ContactEmail,
                detail.ScreenCount, detail.CreatedAt);
    }

    public async Task DeleteVenueAsync(Guid id, CancellationToken ct = default)
    {
        var venue = await _venueRepo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Venue {id} not found.");
        await _venueRepo.VenueDeleteAsync(id, ct);
        await _audit.LogAsync(null, "delete", "venue", id, new { venue.Name }, null, null, ct);
    }

    // ── Screens CRUD ──────────────────────────────────────────────────────────

    public async Task<ScreenDetailDto> CreateScreenAsync(Guid venueId, CreateScreenRequest req, CancellationToken ct = default)
    {
        _ = await _venueRepo.GetByIdAsync(venueId, ct)
            ?? throw new KeyNotFoundException($"Venue {venueId} not found.");

        var (isValid, validationError) = ValidateLayoutJson(req.LayoutJson);
        if (!isValid)
            throw new ArgumentException(validationError ?? "Invalid layout JSON.");

        var totalSeats = CalculateTotalSeats(req.LayoutJson);

        var screen = new Screen
        {
            Id         = Guid.NewGuid(),
            VenueId    = venueId,
            Name       = req.Name,
            Layout     = req.LayoutJson,
            TotalSeats = totalSeats,
            IsActive   = req.IsActive,
        };

        await _screenRepo.AddAsync(screen, ct);
        await _audit.LogAsync(null, "create", "screen", screen.Id, null, new { screen.Name, venueId }, null, ct);

        return new ScreenDetailDto(screen.Id, screen.Name, screen.TotalSeats, screen.IsActive,
            ParseLayoutObject(screen.Layout));
    }

    public async Task<ScreenDetailDto> UpdateScreenAsync(Guid screenId, UpdateScreenRequest req, CancellationToken ct = default)
    {
        var screen = await _screenRepo.GetByIdAsync(screenId, ct)
            ?? throw new KeyNotFoundException($"Screen {screenId} not found.");

        var before = new { screen.Name, screen.TotalSeats };

        if (req.Name != null) screen.Name = req.Name;
        if (req.IsActive.HasValue) screen.IsActive = req.IsActive.Value;

        if (req.LayoutJson != null)
        {
            var (isValid, err) = ValidateLayoutJson(req.LayoutJson);
            if (!isValid) throw new ArgumentException(err ?? "Invalid layout JSON.");
            screen.Layout     = req.LayoutJson;
            screen.TotalSeats = CalculateTotalSeats(req.LayoutJson);
        }

        await _screenRepo.UpdateAsync(screen, ct);
        await _audit.LogAsync(null, "update", "screen", screenId, before,
            new { screen.Name, screen.TotalSeats }, null, ct);

        return new ScreenDetailDto(screen.Id, screen.Name, screen.TotalSeats, screen.IsActive,
            ParseLayoutObject(screen.Layout));
    }

    public async Task DeleteScreenAsync(Guid screenId, CancellationToken ct = default)
    {
        var screen = await _screenRepo.GetByIdAsync(screenId, ct)
            ?? throw new KeyNotFoundException($"Screen {screenId} not found.");
        await _screenRepo.ScreenDeleteAsync(screenId, ct);
        await _audit.LogAsync(null, "delete", "screen", screenId, new { screen.Name }, null, null, ct);
    }

    // ── Shows CRUD ────────────────────────────────────────────────────────────

    public async Task<AdminShowPagedResponse> GetShowsAsync(
        Guid? movieId, Guid? venueId, Guid? screenId,
        DateOnly? fromDate, DateOnly? toDate, string? status,
        int page, int pageSize, CancellationToken ct = default)
    {
        var (items, total) = await _showRepo.GetAllAdminAsync(
            movieId, venueId, screenId, fromDate, toDate, status, page, pageSize, ct);
        return new AdminShowPagedResponse(items, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize));
    }

    public async Task<ShowAdminDto> CreateShowAsync(CreateShowRequest req, CancellationToken ct = default)
    {
        var screen = await _screenRepo.GetByIdAsync(req.ScreenId, ct)
            ?? throw new KeyNotFoundException($"Screen {req.ScreenId} not found.");

        if (req.MovieId.HasValue == req.EventId.HasValue)
            throw new ArgumentException("Exactly one of MovieId or EventId must be provided.");

        if (req.MovieId.HasValue)
        {
            var movie = await _movies.GetByIdAsync(req.MovieId.Value, ct)
                ?? throw new KeyNotFoundException($"Movie {req.MovieId} not found.");
            if (movie.Status != MovieStatus.Published)
                throw new ArgumentException("Movie must be published to create a show.");
        }

        if (req.EventId.HasValue)
        {
            var ev = await _events.GetByIdAsync(req.EventId.Value, ct)
                ?? throw new KeyNotFoundException($"Event {req.EventId} not found.");
            if (ev.Status != MovieStatus.Published)
                throw new ArgumentException("Event must be published to create a show.");
        }

        var showDatetime = req.ShowDate.ToDateTime(req.ShowTime, DateTimeKind.Utc);

        if (showDatetime <= DateTime.UtcNow)
            throw new ArgumentException("Show date and time must be in the future.");

        if (await _showRepo.HasConflictAsync(req.ScreenId, showDatetime, null, ct))
            throw new InvalidOperationException(
                $"Screen already has a show at {req.ShowTime} on {req.ShowDate:dd MMM yyyy}.");

        var show = new Show
        {
            Id             = Guid.NewGuid(),
            ScreenId       = req.ScreenId,
            VenueId        = screen.VenueId,
            MovieId        = req.MovieId,
            EventId        = req.EventId,
            ShowDate       = req.ShowDate,
            ShowTime       = req.ShowTime,
            ShowDatetime   = showDatetime,
            Format         = req.Format,
            Language       = req.Language,
            PriceOverrides = req.PriceOverrides,
            Status         = ShowStatus.Scheduled,
        };

        await _showRepo.AddAsync(show, ct);
        await _audit.LogAsync(null, "create", "show", show.Id, null,
            new { show.ShowDate, show.Format, show.Language }, null, ct);

        var (items, _) = await _showRepo.GetAllAdminAsync(null, null, req.ScreenId, req.ShowDate, req.ShowDate, null, 1, 1, ct);
        return items.FirstOrDefault()
            ?? throw new InvalidOperationException("Failed to retrieve created show.");
    }

    public async Task<CancelShowResponse> CancelShowAsync(Guid showId, CancellationToken ct = default)
    {
        var show = await _showRepo.GetByIdAsync(showId, ct)
            ?? throw new KeyNotFoundException($"Show {showId} not found.");

        if (show.Status == ShowStatus.Cancelled)
            throw new ArgumentException("Show is already cancelled.");
        if (show.Status == ShowStatus.Completed)
            throw new ArgumentException("Cannot cancel a completed show.");

        // Snapshot confirmed bookings BEFORE cancellation so we can notify users
        var confirmedBookings = (await _bookings.GetByShowAsync(showId, ct))
            .Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Pending)
            .ToList();

        var cancelledCount = await _showRepo.CancelAsync(showId, ct);

        await _audit.LogAsync(null, "cancel", "show", showId, null,
            new { cancelledBookings = cancelledCount }, null, ct);

        // Send cancellation emails in the background — don't block the response
        _ = Task.Run(async () =>
        {
            foreach (var booking in confirmedBookings)
            {
                try
                {
                    var user = await _users.GetByIdAsync(booking.UserId);
                    if (user != null)
                        await _email.SendBookingCancelledAsync(booking, user, 0, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send cancellation email for booking {Ref}", booking.BookingRef);
                }
            }
        }, ct);

        return new CancelShowResponse(showId, cancelledCount,
            $"Show cancelled. {cancelledCount} booking(s) have been cancelled.");
    }

    public async Task DeleteShowAsync(Guid showId, CancellationToken ct = default)
    {
        var show = await _showRepo.GetByIdAsync(showId, ct)
            ?? throw new KeyNotFoundException($"Show {showId} not found.");

        show.DeletedAt = DateTime.UtcNow;
        await _showRepo.UpdateAsync(show, ct);
        await _audit.LogAsync(null, "delete", "show", showId, null, null, null, ct);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant().Trim();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        return slug.Trim('-');
    }

    private async Task<string> EnsureUniqueMovieSlug(string baseSlug, Guid? excludeId, CancellationToken ct)
    {
        var slug = baseSlug;
        int suffix = 2;
        while (true)
        {
            var existing = await _movies.FindBySlugAsync(slug, ct);
            if (existing is null || existing.Id == excludeId) return slug;
            slug = $"{baseSlug}-{suffix++}";
        }
    }

    private async Task<string> EnsureUniqueVenueSlug(string baseSlug, Guid? excludeId, CancellationToken ct)
    {
        var slug = baseSlug;
        int suffix = 2;
        while (true)
        {
            var existing = await _venueRepo.FindBySlugAsync(slug, ct);
            if (existing is null || existing.Id == excludeId) return slug;
            slug = $"{baseSlug}-{suffix++}";
        }
    }

    private async Task<string> EnsureUniqueEventSlug(string baseSlug, Guid? excludeId, CancellationToken ct)
    {
        var slug = baseSlug;
        int suffix = 2;
        while (true)
        {
            var existing = await _events.FindBySlugAsync(slug, ct);
            if (existing is null || existing.Id == excludeId) return slug;
            slug = $"{baseSlug}-{suffix++}";
        }
    }

    private static void ApplyTmdbData(Movie movie, JsonElement root, string title)
    {
        movie.TmdbId      = root.TryGetProperty("id", out var idEl) ? idEl.GetInt32() : movie.TmdbId;
        movie.Title       = title;
        movie.Description = root.TryGetProperty("overview", out var ov) ? ov.GetString() : movie.Description;
        movie.DurationMin = root.TryGetProperty("runtime", out var rt) && rt.ValueKind != JsonValueKind.Null
            ? rt.GetInt32() : movie.DurationMin;
        movie.ImdbRating  = root.TryGetProperty("vote_average", out var va) && va.ValueKind != JsonValueKind.Null
            ? (decimal)va.GetDouble() : movie.ImdbRating;

        if (root.TryGetProperty("release_date", out var rd) && rd.ValueKind != JsonValueKind.Null)
            movie.ReleaseDate = DateOnly.TryParse(rd.GetString(), out var d) ? d : movie.ReleaseDate;

        if (root.TryGetProperty("poster_path", out var pp) && pp.ValueKind != JsonValueKind.Null)
            movie.PosterUrl = $"https://image.tmdb.org/t/p/w500{pp.GetString()}";
        if (root.TryGetProperty("backdrop_path", out var bp) && bp.ValueKind != JsonValueKind.Null)
            movie.BackdropUrl = $"https://image.tmdb.org/t/p/original{bp.GetString()}";

        if (root.TryGetProperty("genres", out var genres))
            movie.Genres = genres.EnumerateArray()
                .Where(g => g.TryGetProperty("name", out _))
                .Select(g => g.GetProperty("name").GetString()!)
                .ToArray();

        if (root.TryGetProperty("videos", out var videos) && videos.TryGetProperty("results", out var vResults))
        {
            var trailer = vResults.EnumerateArray().FirstOrDefault(v =>
                v.TryGetProperty("type", out var t) && t.GetString() == "Trailer" &&
                v.TryGetProperty("site", out var s) && s.GetString() == "YouTube");
            if (trailer.ValueKind != JsonValueKind.Undefined && trailer.TryGetProperty("key", out var key))
                movie.TrailerUrl = $"https://www.youtube.com/watch?v={key.GetString()}";
        }

        if (root.TryGetProperty("credits", out var credits))
        {
            if (credits.TryGetProperty("cast", out var cast))
            {
                var castList = cast.EnumerateArray().Take(10)
                    .Where(c => c.TryGetProperty("name", out _))
                    .Select(c => new
                    {
                        name      = c.GetProperty("name").GetString(),
                        role      = c.TryGetProperty("character", out var ch) ? ch.GetString() : null,
                        photo     = c.TryGetProperty("profile_path", out var ph) && ph.ValueKind != JsonValueKind.Null
                                    ? $"https://image.tmdb.org/t/p/w185{ph.GetString()}" : null,
                    })
                    .ToList();
                movie.Cast = JsonSerializer.Serialize(castList);
            }
            if (credits.TryGetProperty("crew", out var crew))
            {
                var roles = new[] { "Director", "Producer", "Music Director", "Composer" };
                var crewList = crew.EnumerateArray()
                    .Where(c => c.TryGetProperty("job", out var j) && roles.Contains(j.GetString()))
                    .Select(c => new
                    {
                        name = c.TryGetProperty("name", out var n) ? n.GetString() : null,
                        role = c.TryGetProperty("job",  out var j) ? j.GetString() : null,
                    })
                    .ToList();
                movie.Crew = JsonSerializer.Serialize(crewList);
            }
        }
    }

    private static (bool IsValid, string? Error) ValidateLayoutJson(string json)
    {
        try
        {
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("cols", out var colsEl) || colsEl.GetInt32() <= 0 || colsEl.GetInt32() > 30)
                return (false, "cols must be between 1 and 30.");

            if (!root.TryGetProperty("categories", out var cats) || cats.GetArrayLength() == 0)
                return (false, "At least one category is required.");

            var usedRows = new HashSet<string>();
            foreach (var cat in cats.EnumerateArray())
            {
                if (!cat.TryGetProperty("name", out var nameEl) || string.IsNullOrWhiteSpace(nameEl.GetString()))
                    return (false, "Each category must have a name.");
                if (!cat.TryGetProperty("rows", out var rowsEl) || rowsEl.GetArrayLength() == 0)
                    return (false, "Each category must have at least one row.");
                if (!cat.TryGetProperty("price", out var priceEl) || priceEl.GetDecimal() <= 0)
                    return (false, "Each category must have a price > 0.");

                foreach (var row in rowsEl.EnumerateArray())
                {
                    var r = row.GetString() ?? "";
                    if (r.Length != 1 || r[0] < 'A' || r[0] > 'Z')
                        return (false, $"Row letter '{r}' is invalid. Use single A-Z letters.");
                    if (!usedRows.Add(r))
                        return (false, $"Duplicate row letter '{r}'.");
                }
            }

            return (true, null);
        }
        catch (JsonException ex)
        {
            return (false, $"Invalid JSON: {ex.Message}");
        }
    }

    private static int CalculateTotalSeats(string layoutJson)
    {
        try
        {
            var doc = JsonDocument.Parse(layoutJson);
            var root = doc.RootElement;
            if (!root.TryGetProperty("cols", out var colsEl)) return 0;
            var cols = colsEl.GetInt32();

            var total = 0;
            if (root.TryGetProperty("categories", out var cats))
                foreach (var cat in cats.EnumerateArray())
                    if (cat.TryGetProperty("rows", out var rows))
                        total += rows.GetArrayLength() * cols;

            var blocked = 0;
            if (root.TryGetProperty("blockedSeats", out var bs))
                blocked = bs.GetArrayLength();

            return Math.Max(0, total - blocked);
        }
        catch { return 0; }
    }

    private static object? ParseLayoutObject(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        try { return JsonSerializer.Deserialize<object>(raw); }
        catch { return null; }
    }

    private static T? ParseEnum<T>(string? value) where T : struct, Enum =>
        Enum.TryParse<T>(value, ignoreCase: true, out var result) ? result : null;

    private static DateOnly? ParseDateOnly(string? value) =>
        DateOnly.TryParse(value, out var d) ? d : null;

    // Npgsql requires DateTimeKind.Utc for 'timestamp with time zone' columns.
    // JSON-deserialized DateTime arrives as Unspecified — treat it as UTC.
    private static DateTime? ToUtc(DateTime? dt) =>
        dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;

    private static AdminMovieResponse MapMovieResponse(Movie m) => new(
        m.Id, m.TmdbId, m.Title, m.Slug, m.Certificate, m.DurationMin,
        m.Languages, m.Formats, m.Genres,
        m.ReleaseDate?.ToString("yyyy-MM-dd"), m.PosterUrl, m.BackdropUrl, m.TrailerUrl,
        m.ImdbRating, m.Status.ToString(), m.Category.ToString(),
        m.CreatedAt, m.UpdatedAt);

    private static AdminMovieDetailResponse MapMovieDetail(Movie m) => new(
        m.Id, m.TmdbId, m.Title, m.Slug, m.Description, m.Certificate, m.DurationMin,
        m.Languages, m.Formats, m.Genres, m.Cast, m.Crew,
        m.ReleaseDate?.ToString("yyyy-MM-dd"), m.PosterUrl, m.BackdropUrl, m.TrailerUrl,
        m.ImdbRating, m.Status.ToString(), m.Category.ToString(),
        m.CreatedAt, m.UpdatedAt);

    private static AdminEventResponse MapEventResponse(Event e, Dictionary<Guid, string> venueNames)
    {
        var venueName = e.VenueId.HasValue && venueNames.TryGetValue(e.VenueId.Value, out var vn) ? vn : "Unknown";
        var dateLabel = e.EventDate?.ToLocalTime().ToString("ddd, d MMM yyyy") ?? "TBA";
        var lowestPrice = 0m;
        if (!string.IsNullOrEmpty(e.PriceTiers))
        {
            try
            {
                var tiers = JsonSerializer.Deserialize<JsonElement[]>(e.PriceTiers);
                if (tiers?.Length > 0)
                    lowestPrice = tiers
                        .Where(t => t.TryGetProperty("price", out _))
                        .Select(t => t.GetProperty("price").GetDecimal())
                        .DefaultIfEmpty(0m).Min();
            }
            catch { /* malformed JSON — ignore */ }
        }
        return new AdminEventResponse(
            e.Id, e.Title, e.Slug, e.Type.ToString(),
            e.EventDate?.ToString("o"), dateLabel,
            e.Language, e.AgeRestriction ?? 0,
            venueName, e.Status.ToString(), lowestPrice, e.CreatedAt);
    }

    private static AdminEventDetailResponse MapEventDetail(Event e, string venueName)
    {
        return new AdminEventDetailResponse(
            e.Id, e.Title, e.Slug, e.Type.ToString(),
            e.Description, e.VenueId, venueName,
            e.EventDate?.ToString("o"), e.DurationMin,
            e.Language, e.AgeRestriction ?? 0,
            e.Organizer, e.Artists, e.PriceTiers,
            e.PosterUrl, e.BackdropUrl,
            e.Status.ToString(), e.CreatedAt, e.UpdatedAt);
    }

    // ── Admin Bookings ────────────────────────────────────────────────────────

    public async Task<AdminBookingPagedResponse> GetAdminBookingsAsync(
        string? search, string? status, Guid? movieId, Guid? cityId,
        DateOnly? fromDate, DateOnly? toDate,
        int page, int pageSize, CancellationToken ct = default)
    {
        var (items, total) = await _bookings.GetAllAdminAsync(
            search, status, movieId, cityId, fromDate, toDate, page, pageSize, ct);
        return new AdminBookingPagedResponse(items, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize));
    }

    public async Task<AdminBookingDto> GetAdminBookingDetailAsync(string bookingRef, CancellationToken ct = default)
    {
        var detail = await _bookings.GetBookingDetailAdminAsync(bookingRef, ct)
            ?? throw new KeyNotFoundException($"Booking {bookingRef} not found.");
        return detail;
    }

    public async Task<AdminCancelBookingResponse> AdminCancelBookingAsync(
        string bookingRef, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByRefAsync(bookingRef, ct)
            ?? throw new KeyNotFoundException($"Booking {bookingRef} not found.");

        // Snapshot user BEFORE cancellation for email
        var user = await _users.GetByIdAsync(booking.UserId, ct);

        var (cancelledBooking, refundAmount, _) = await _bookings.AdminCancelBookingAsync(booking.Id, ct);

        if (user != null)
        {
            _ = Task.Run(async () =>
            {
                try { await _email.SendBookingCancelledAsync(cancelledBooking, user, refundAmount); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to send cancel email for {Ref}", bookingRef); }
            });
        }

        await _audit.LogAsync(null, "admin_cancel", "booking", booking.Id, null,
            new { bookingRef, refundAmount }, null, ct);

        return new AdminCancelBookingResponse(
            bookingRef, "Cancelled",
            refundAmount > 0
                ? $"Booking cancelled. Refund of ₹{refundAmount:F2} will be processed."
                : "Booking cancelled. No refund applicable.",
            refundAmount);
    }

    public async Task<AdminRefundResponse> AdminProcessRefundAsync(
        string bookingRef, decimal refundAmount, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByRefAsync(bookingRef, ct)
            ?? throw new KeyNotFoundException($"Booking {bookingRef} not found.");

        var (refId, _) = await _bookings.AdminProcessRefundAsync(booking.Id, refundAmount, ct);

        await _audit.LogAsync(null, "refund", "booking", booking.Id, null,
            new { bookingRef, refundAmount }, null, ct);

        return new AdminRefundResponse(
            bookingRef, refId, refundAmount,
            $"Refund of ₹{refundAmount:F2} processed successfully.");
    }

    public async Task ResendBookingEmailAsync(string bookingRef, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByRefAsync(bookingRef, ct)
            ?? throw new KeyNotFoundException($"Booking {bookingRef} not found.");

        var user = await _users.GetByIdAsync(booking.UserId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        // Fire-and-forget resend (confirmation email is the stored one)
        _ = Task.Run(async () =>
        {
            try
            {
                await _email.SendBookingCancelledAsync(booking, user, 0);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to resend email for {Ref}", bookingRef);
            }
        });
    }

    // ── Admin Users ───────────────────────────────────────────────────────────

    public async Task<AdminUserPagedResponse> GetAdminUsersAsync(
        string? search, string? role, bool? isBlocked, Guid? cityId,
        int page, int pageSize, CancellationToken ct = default)
    {
        var (items, total) = await _users.GetAllAdminAsync(
            search, role, isBlocked, cityId, page, pageSize, ct);
        return new AdminUserPagedResponse(items, total, page, pageSize,
            (int)Math.Ceiling((double)total / pageSize));
    }

    public async Task<AdminUserDetailDto> GetAdminUserDetailAsync(Guid userId, CancellationToken ct = default)
    {
        return await _users.GetUserWithBookingsAsync(userId, ct)
            ?? throw new KeyNotFoundException($"User {userId} not found.");
    }

    public async Task BlockUserAsync(Guid userId, CancellationToken ct = default)
    {
        await _users.BlockUserAsync(userId, ct);
        await _audit.LogAsync(null, "block", "user", userId, null, null, null, ct);
    }

    public async Task UnblockUserAsync(Guid userId, CancellationToken ct = default)
    {
        await _users.UnblockUserAsync(userId, ct);
        await _audit.LogAsync(null, "unblock", "user", userId, null, null, null, ct);
    }

    public async Task<string> AdminResetPasswordAsync(Guid userId, CancellationToken ct = default)
    {
        var tempPassword = await _users.AdminResetPasswordAsync(userId, ct);
        await _audit.LogAsync(null, "reset_password", "user", userId, null, null, null, ct);
        return tempPassword;
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    public async Task<BookingReportResponse> GetBookingReportAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy,
        Guid? cityId, Guid? movieId, Guid? venueId, CancellationToken ct = default)
    {
        var rows = await FetchBookingReportRowsAsync(fromDate, toDate, groupBy, cityId, movieId, venueId, ct);

        var summary = new ReportSummary(
            TotalBookings:        rows.Sum(r => r.TotalBookings),
            ConfirmedBookings:    rows.Sum(r => r.ConfirmedBookings),
            CancelledBookings:    rows.Sum(r => r.CancelledBookings),
            TotalRevenue:         rows.Sum(r => r.Revenue),
            ConvenienceFeeRevenue: rows.Sum(r => r.ConvenienceFeeRevenue),
            GstCollected:         rows.Sum(r => r.GstCollected),
            TotalDiscount:        rows.Sum(r => r.Discount),
            NetRevenue:           rows.Sum(r => r.Revenue) - rows.Sum(r => r.Discount));

        return new BookingReportResponse(
            fromDate.ToString("yyyy-MM-dd"),
            toDate.ToString("yyyy-MM-dd"),
            groupBy, summary, rows);
    }

    public async Task<UserReportResponse> GetUserAcquisitionReportAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy, CancellationToken ct = default)
    {
        var rows = await FetchUserReportRowsAsync(fromDate, toDate, groupBy, ct);
        return new UserReportResponse(
            fromDate.ToString("yyyy-MM-dd"),
            toDate.ToString("yyyy-MM-dd"),
            rows.Sum(r => r.NewUsers),
            rows.Sum(r => r.VerifiedUsers),
            rows);
    }

    public async Task<byte[]> ExportBookingReportCsvAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy,
        Guid? cityId, Guid? movieId, Guid? venueId, CancellationToken ct = default)
    {
        var rows = await FetchBookingReportRowsAsync(fromDate, toDate, groupBy, cityId, movieId, venueId, ct);
        var sb = new StringBuilder();
        sb.AppendLine("Period,Total Bookings,Confirmed,Cancelled,Revenue (INR),Conv. Fee Revenue (INR),GST Collected (INR),Discount (INR)");
        foreach (var r in rows)
            sb.AppendLine($"{r.Period},{r.TotalBookings},{r.ConfirmedBookings},{r.CancelledBookings},{r.Revenue:F2},{r.ConvenienceFeeRevenue:F2},{r.GstCollected:F2},{r.Discount:F2}");
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportUserReportCsvAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy, CancellationToken ct = default)
    {
        var rows = await FetchUserReportRowsAsync(fromDate, toDate, groupBy, ct);
        var sb = new StringBuilder();
        sb.AppendLine("Period,New Users,Verified");
        foreach (var r in rows)
            sb.AppendLine($"{r.Period},{r.NewUsers},{r.VerifiedUsers}");
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private async Task<List<ReportRow>> FetchBookingReportRowsAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy,
        Guid? cityId, Guid? movieId, Guid? venueId, CancellationToken ct)
    {
        var dtos = await _bookings.GetAllForReportAsync(fromDate, toDate, cityId, movieId, venueId, ct);
        if (dtos.Count == 0) return [];

        Func<AdminBookingDto, string> periodKey = groupBy.ToLower() switch
        {
            "week"  => d => GetWeekLabel(d.CreatedAt),
            "month" => d => d.CreatedAt.ToString("MMMM yyyy"),
            "movie" => d => d.MovieTitle ?? d.EventTitle ?? "Unknown",
            "venue" => d => d.VenueName,
            "city"  => d => d.CityName,
            _       => d => d.CreatedAt.ToString("yyyy-MM-dd"),
        };

        Func<IGrouping<string, AdminBookingDto>, Guid?> entityId = groupBy.ToLower() switch
        {
            "movie" => _ => null,
            "venue" => _ => null,
            "city"  => _ => null,
            _       => _ => null,
        };

        return dtos
            .GroupBy(periodKey)
            .OrderBy(g => g.Key)
            .Select(g => new ReportRow(
                Period:               g.Key,
                EntityId:             null,
                PosterUrl:            g.First().PosterUrl,
                TotalBookings:        g.Count(),
                ConfirmedBookings:    g.Count(d => d.Status == "Confirmed"),
                CancelledBookings:    g.Count(d => d.Status == "Cancelled"),
                Revenue:              g.Where(d => d.Status == "Confirmed").Sum(d => d.AmountPaid),
                ConvenienceFeeRevenue: g.Where(d => d.Status == "Confirmed").Sum(d => d.ConvenienceFee),
                GstCollected:         g.Where(d => d.Status == "Confirmed").Sum(d => d.Cgst + d.Sgst + d.Igst),
                Discount:             g.Where(d => d.Status == "Confirmed").Sum(d => d.Discount)))
            .ToList();
    }

    private async Task<List<UserReportRow>> FetchUserReportRowsAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy, CancellationToken ct)
    {
        var (items, _) = await _users.GetAllAdminAsync(null, null, null, null, 1, 10000, ct);
        var fromDt = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toDt   = toDate.ToDateTime(TimeOnly.MaxValue,   DateTimeKind.Utc);
        var filtered = items.Where(u => u.CreatedAt >= fromDt && u.CreatedAt <= toDt).ToList();

        Func<AdminUserDto, string> keySelector = groupBy.ToLower() switch
        {
            "week"  => u => GetWeekLabel(u.CreatedAt),
            "month" => u => u.CreatedAt.ToString("MMMM yyyy"),
            _       => u => u.CreatedAt.ToString("yyyy-MM-dd"),
        };

        return filtered
            .GroupBy(keySelector)
            .OrderBy(g => g.Key)
            .Select(g => new UserReportRow(
                Period:        g.Key,
                NewUsers:      g.Count(),
                VerifiedUsers: g.Count(u => u.EmailVerified)))
            .ToList();
    }

    private static string GetWeekLabel(DateTime dt)
    {
        var cal  = CultureInfo.InvariantCulture.Calendar;
        var week = cal.GetWeekOfYear(dt, CalendarWeekRule.FirstDay, DayOfWeek.Monday);
        return $"W{week} {dt.Year}";
    }

    // ── CMS Banners ───────────────────────────────────────────────────────────

    public async Task<List<AdminBannerResponse>> GetBannersAdminAsync(CancellationToken ct = default)
    {
        var banners = await _bannerRepo.GetAllAdminAsync(ct);
        return banners.Select(MapBanner).ToList();
    }

    public async Task<AdminBannerResponse> GetBannerByIdAsync(Guid id, CancellationToken ct = default)
    {
        var banner = await _bannerRepo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Banner {id} not found.");
        return MapBanner(banner);
    }

    public async Task<AdminBannerResponse> CreateBannerAsync(CreateBannerRequest req, CancellationToken ct = default)
    {
        var banner = new CmsBanner
        {
            Id        = Guid.NewGuid(),
            Title     = req.Title,
            ImageUrl  = req.ImageUrl,
            LinkUrl   = req.LinkUrl,
            Position  = req.Position,
            IsActive  = req.IsActive,
            StartsAt  = ToUtc(req.StartsAt),
            EndsAt    = ToUtc(req.EndsAt),
        };
        await _bannerRepo.AddAsync(banner, ct);
        await _audit.LogAsync(null, "create", "banner", banner.Id, null, new { banner.Title }, null, ct);
        return MapBanner(banner);
    }

    public async Task<AdminBannerResponse> UpdateBannerAsync(Guid id, UpdateBannerRequest req, CancellationToken ct = default)
    {
        var banner = await _bannerRepo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Banner {id} not found.");
        var before = new { banner.Title, banner.IsActive };
        if (req.Title    != null) banner.Title    = req.Title;
        if (req.ImageUrl != null) banner.ImageUrl = req.ImageUrl;
        if (req.LinkUrl  != null) banner.LinkUrl  = req.LinkUrl;
        if (req.Position.HasValue) banner.Position = req.Position.Value;
        if (req.IsActive.HasValue) banner.IsActive = req.IsActive.Value;
        if (req.StartsAt.HasValue) banner.StartsAt = ToUtc(req.StartsAt);
        if (req.EndsAt.HasValue)   banner.EndsAt   = ToUtc(req.EndsAt);
        banner.UpdatedAt = DateTime.UtcNow;
        await _bannerRepo.UpdateAsync(banner, ct);
        await _audit.LogAsync(null, "update", "banner", id, before, new { banner.Title, banner.IsActive }, null, ct);
        return MapBanner(banner);
    }

    public async Task DeleteBannerAsync(Guid id, CancellationToken ct = default)
    {
        var banner = await _bannerRepo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Banner {id} not found.");
        await _bannerRepo.SoftDeleteAsync(id, ct);
        await _audit.LogAsync(null, "delete", "banner", id, new { banner.Title }, null, null, ct);
    }

    public async Task ReorderBannersAsync(List<Guid> orderedIds, CancellationToken ct = default)
    {
        for (int i = 0; i < orderedIds.Count; i++)
            await _bannerRepo.UpdatePositionAsync(orderedIds[i], i, ct);
        await _audit.LogAsync(null, "reorder", "banners", null, null, new { count = orderedIds.Count }, null, ct);
    }

    public async Task ToggleBannerAsync(Guid id, bool isActive, CancellationToken ct = default)
    {
        await _bannerRepo.ToggleActiveAsync(id, isActive, ct);
    }

    private static AdminBannerResponse MapBanner(CmsBanner b) =>
        new(b.Id, b.Title, b.ImageUrl, b.LinkUrl, b.Position, b.IsActive, b.StartsAt, b.EndsAt, b.CreatedAt, b.UpdatedAt);

    // ── Settings ──────────────────────────────────────────────────────────────

    public async Task<List<SettingResponse>> GetAllSettingsAsync(CancellationToken ct = default)
    {
        var dict = await _settingRepo.GetAllAsync(ct);
        return dict
            .OrderBy(kv => kv.Key)
            .Select(kv => new SettingResponse(kv.Key, kv.Value, DateTime.UtcNow))
            .ToList();
    }

    public async Task<SettingResponse?> GetSettingAsync(string key, CancellationToken ct = default)
    {
        var val = await _settingRepo.GetAsync(key, ct);
        return val is null ? null : new SettingResponse(key, val, DateTime.UtcNow);
    }

    public async Task<SettingResponse> UpdateSettingAsync(string key, string value, CancellationToken ct = default)
    {
        var oldVal = await _settingRepo.GetAsync(key, ct);
        await _settingRepo.SetAsync(key, value, ct);
        await _audit.LogAsync(null, "update", "setting", null,
            new { key, value = oldVal },
            new { key, value }, null, ct);
        return new SettingResponse(key, value, DateTime.UtcNow);
    }

    public async Task UpdateMultipleSettingsAsync(Dictionary<string, string> settings, CancellationToken ct = default)
    {
        foreach (var (key, value) in settings)
            await UpdateSettingAsync(key, value, ct);
    }
}
