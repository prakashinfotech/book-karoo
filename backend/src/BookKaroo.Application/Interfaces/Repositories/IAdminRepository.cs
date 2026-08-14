using BookKaroo.Application.DTOs.Admin;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IAdminRepository
{
    Task<int>     CountTodayBookingsAsync(DateTime todayStart, DateTime todayEnd, CancellationToken ct = default);
    Task<decimal> SumTodayRevenueAsync(DateTime todayStart, DateTime todayEnd, CancellationToken ct = default);
    Task<decimal> SumWeekRevenueAsync(DateTime weekStart, CancellationToken ct = default);
    Task<decimal> SumMonthRevenueAsync(DateTime monthStart, CancellationToken ct = default);
    Task<int>     CountTotalUsersAsync(CancellationToken ct = default);
    Task<int>     CountNewUsersTodayAsync(DateTime todayStart, DateTime todayEnd, CancellationToken ct = default);
    Task<TopMovieDto?> GetTopMovieThisWeekAsync(DateTime weekStart, CancellationToken ct = default);
    Task<IReadOnlyList<DayCount>> GetBookingsPerDayAsync(DateTime fromDate, CancellationToken ct = default);
    Task<IReadOnlyList<CityRevenue>> GetRevenuePerCityAsync(int top, CancellationToken ct = default);
    Task<IReadOnlyList<RecentBookingDto>> GetRecentBookingsAsync(int count, CancellationToken ct = default);
    Task<IReadOnlyList<ActivityDto>> GetRecentActivityAsync(int count, CancellationToken ct = default);
    Task<(IReadOnlyList<AuditLogResponse> Items, int Total)> GetAuditLogsAsync(
        string? entityType, int page, int pageSize, CancellationToken ct = default);
}
