using BookKaroo.Application.Common;
using BookKaroo.Application.DTOs.Partner;

namespace BookKaroo.Application.Interfaces.Services;

public interface IPartnerDashboardService
{
    Task<PartnerDashboardResponse> GetDashboardAsync(IPartnerContext ctx, CancellationToken ct);
    Task<PartnerReportResponse> GetReportAsync(IPartnerContext ctx, DateOnly? fromDate, DateOnly? toDate, CancellationToken ct);
}

public interface IPartnerVenueService
{
    Task<List<PartnerVenueListItem>> GetMyVenuesAsync(IPartnerContext ctx, CancellationToken ct);
    Task<PartnerVenueDetail> GetVenueWithScreensAsync(IPartnerContext ctx, Guid venueId, CancellationToken ct);
    Task<PartnerVenueDetail> UpdateVenueOperationalDetailsAsync(IPartnerContext ctx, Guid venueId, UpdateVenueOperationalRequest req, CancellationToken ct);
    Task<PartnerScreenInfo> CreateScreenAsync(IPartnerContext ctx, Guid venueId, CreateScreenRequest req, CancellationToken ct);
    Task<PartnerScreenInfo> UpdateScreenAsync(IPartnerContext ctx, Guid screenId, UpdateScreenRequest req, CancellationToken ct);
    Task DeleteScreenAsync(IPartnerContext ctx, Guid screenId, CancellationToken ct);
}

public interface IPartnerShowService
{
    Task<(List<PartnerShowResponse> Items, int Total)> GetShowsAsync(
        IPartnerContext ctx, Guid? venueId, Guid? screenId,
        DateOnly? fromDate, DateOnly? toDate, string? status, string? search,
        int page, int pageSize, CancellationToken ct);
    Task<PartnerShowResponse> CreateShowAsync(IPartnerContext ctx, CreatePartnerShowRequest req, CancellationToken ct);
    Task CancelShowAsync(IPartnerContext ctx, Guid showId, CancellationToken ct);
    Task DeleteShowAsync(IPartnerContext ctx, Guid showId, CancellationToken ct);
}

public interface IPartnerBookingService
{
    Task<PartnerBookingPage> GetBookingsAsync(
        IPartnerContext ctx, string? search, string? status, Guid? venueId,
        DateOnly? fromDate, DateOnly? toDate, int page, int pageSize, CancellationToken ct);
    Task<PartnerBookingDetail> GetBookingDetailAsync(IPartnerContext ctx, string bookingRef, CancellationToken ct);
    Task<PartnerBookingDetail> CancelBookingAsync(IPartnerContext ctx, string bookingRef, CancellationToken ct);
}

public interface IPartnerReviewService
{
    Task<PartnerReviewPage> GetReviewsAsync(
        IPartnerContext ctx, Guid? venueId, string? status, string sort,
        int page, int pageSize, CancellationToken ct);
    Task HideReviewAsync(IPartnerContext ctx, Guid reviewId, CancellationToken ct);
    Task ShowReviewAsync(IPartnerContext ctx, Guid reviewId, CancellationToken ct);
}

public interface IAdminPartnerService
{
    Task<AdminPartnerPage> GetAllAsync(string? search, bool? isActive, int page, int pageSize, CancellationToken ct);
    Task<AdminPartnerResponse> GetByIdAsync(Guid partnerId, CancellationToken ct);
    Task<CreatePartnerResponse> CreatePartnerAsync(CreatePartnerRequest req, Guid? createdBy, CancellationToken ct);
    Task<AdminPartnerResponse> UpdatePartnerAsync(Guid partnerId, UpdatePartnerRequest req, CancellationToken ct);
    Task<AdminPartnerResponse> SetActiveAsync(Guid partnerId, bool isActive, CancellationToken ct);
    Task<AdminPartnerResponse> GrantVenueAccessAsync(Guid partnerId, Guid venueId, Guid? grantedBy, CancellationToken ct);
    Task<AdminPartnerResponse> RevokeVenueAccessAsync(Guid partnerId, Guid venueId, CancellationToken ct);
}
