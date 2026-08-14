using BookKaroo.Application.DTOs.Admin;

namespace BookKaroo.Application.Interfaces.Services;

public interface IAdminService
{
    Task<int> SyncTmdbPostersAsync(CancellationToken ct = default);
    Task<DashboardResponse> GetDashboardAsync(CancellationToken ct = default);
    Task<AuditLogPagedResponse> GetAuditLogsAsync(
        string? entityType, int page, int pageSize, CancellationToken ct = default);

    // Movies
    Task<AdminMoviePagedResponse> GetMoviesAsync(
        string? search, string? status, string? category,
        int page, int pageSize, CancellationToken ct = default);
    Task<AdminMovieDetailResponse> GetMovieByIdAsync(Guid id, CancellationToken ct = default);
    Task<AdminMovieResponse> CreateMovieAsync(CreateMovieRequest req, CancellationToken ct = default);
    Task<AdminMovieResponse> UpdateMovieAsync(Guid id, UpdateMovieRequest req, CancellationToken ct = default);
    Task DeleteMovieAsync(Guid id, CancellationToken ct = default);
    Task<AdminMovieResponse> SyncFromTmdbAsync(int tmdbId, CancellationToken ct = default);
    Task<ImportPopularResult> ImportPopularAsync(CancellationToken ct = default);

    // Events
    Task<AdminEventPagedResponse> GetEventsAsync(
        string? search, string? type, string? status,
        int page, int pageSize, CancellationToken ct = default);
    Task<AdminEventDetailResponse> GetEventByIdAsync(Guid id, CancellationToken ct = default);
    Task<AdminEventResponse> CreateEventAsync(CreateEventRequest req, CancellationToken ct = default);
    Task<AdminEventResponse> UpdateEventAsync(Guid id, UpdateEventRequest req, CancellationToken ct = default);
    Task DeleteEventAsync(Guid id, CancellationToken ct = default);

    // Venues list (for event form)
    Task<IReadOnlyList<AdminVenueItem>> GetVenuesAsync(CancellationToken ct = default);

    // Admin Bookings
    Task<AdminBookingPagedResponse> GetAdminBookingsAsync(
        string? search, string? status, Guid? movieId, Guid? cityId,
        DateOnly? fromDate, DateOnly? toDate,
        int page, int pageSize, CancellationToken ct = default);

    Task<AdminBookingDto> GetAdminBookingDetailAsync(string bookingRef, CancellationToken ct = default);

    Task<AdminCancelBookingResponse> AdminCancelBookingAsync(string bookingRef, CancellationToken ct = default);

    Task<AdminRefundResponse> AdminProcessRefundAsync(string bookingRef, decimal refundAmount, CancellationToken ct = default);

    Task ResendBookingEmailAsync(string bookingRef, CancellationToken ct = default);

    // Admin Users
    Task<AdminUserPagedResponse> GetAdminUsersAsync(
        string? search, string? role, bool? isBlocked, Guid? cityId,
        int page, int pageSize, CancellationToken ct = default);

    Task<AdminUserDetailDto> GetAdminUserDetailAsync(Guid userId, CancellationToken ct = default);

    Task BlockUserAsync(Guid userId, CancellationToken ct = default);
    Task UnblockUserAsync(Guid userId, CancellationToken ct = default);
    Task<string> AdminResetPasswordAsync(Guid userId, CancellationToken ct = default);

    // Venues CRUD
    Task<AdminVenuePagedResponse> GetVenuesPaginatedAsync(
        string? search, Guid? cityId, string? chain,
        int page, int pageSize, CancellationToken ct = default);

    Task<VenueWithScreensDto> GetVenueWithScreensAsync(Guid id, CancellationToken ct = default);

    Task<VenueAdminDto> CreateVenueAsync(CreateVenueRequest req, CancellationToken ct = default);
    Task<VenueAdminDto> UpdateVenueAsync(Guid id, UpdateVenueRequest req, CancellationToken ct = default);
    Task DeleteVenueAsync(Guid id, CancellationToken ct = default);

    // Screens CRUD
    Task<ScreenDetailDto> CreateScreenAsync(Guid venueId, CreateScreenRequest req, CancellationToken ct = default);
    Task<ScreenDetailDto> UpdateScreenAsync(Guid screenId, UpdateScreenRequest req, CancellationToken ct = default);
    Task DeleteScreenAsync(Guid screenId, CancellationToken ct = default);

    // Shows CRUD
    Task<AdminShowPagedResponse> GetShowsAsync(
        Guid? movieId, Guid? venueId, Guid? screenId,
        DateOnly? fromDate, DateOnly? toDate, string? status,
        int page, int pageSize, CancellationToken ct = default);

    Task<ShowAdminDto> CreateShowAsync(CreateShowRequest req, CancellationToken ct = default);
    Task<CancelShowResponse> CancelShowAsync(Guid showId, CancellationToken ct = default);
    Task DeleteShowAsync(Guid showId, CancellationToken ct = default);

    // Reports
    Task<BookingReportResponse> GetBookingReportAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy,
        Guid? cityId, Guid? movieId, Guid? venueId, CancellationToken ct = default);

    Task<UserReportResponse> GetUserAcquisitionReportAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy, CancellationToken ct = default);

    Task<byte[]> ExportBookingReportCsvAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy,
        Guid? cityId, Guid? movieId, Guid? venueId, CancellationToken ct = default);

    Task<byte[]> ExportUserReportCsvAsync(
        DateOnly fromDate, DateOnly toDate, string groupBy, CancellationToken ct = default);

    // CMS Banners
    Task<List<AdminBannerResponse>> GetBannersAdminAsync(CancellationToken ct = default);
    Task<AdminBannerResponse> GetBannerByIdAsync(Guid id, CancellationToken ct = default);
    Task<AdminBannerResponse> CreateBannerAsync(CreateBannerRequest req, CancellationToken ct = default);
    Task<AdminBannerResponse> UpdateBannerAsync(Guid id, UpdateBannerRequest req, CancellationToken ct = default);
    Task DeleteBannerAsync(Guid id, CancellationToken ct = default);
    Task ReorderBannersAsync(List<Guid> orderedIds, CancellationToken ct = default);
    Task ToggleBannerAsync(Guid id, bool isActive, CancellationToken ct = default);

    // Settings
    Task<List<SettingResponse>> GetAllSettingsAsync(CancellationToken ct = default);
    Task<SettingResponse?> GetSettingAsync(string key, CancellationToken ct = default);
    Task<SettingResponse> UpdateSettingAsync(string key, string value, CancellationToken ct = default);
    Task UpdateMultipleSettingsAsync(Dictionary<string, string> settings, CancellationToken ct = default);
}
