using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Application.DTOs.Shows;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IShowRepository : IRepository<Show>
{
    Task<IEnumerable<Show>> GetByMovieAndDateAsync(Guid movieId, DateOnly date, CancellationToken ct = default);
    Task<IEnumerable<Show>> GetByMovieAndDateAsync(Guid movieId, Guid cityId, DateOnly date, CancellationToken ct = default);
    Task<SeatAvailability>  GetSeatAvailabilityAsync(Guid showId, CancellationToken ct = default);
    new Task<Show?>         GetByIdAsync(Guid showId, CancellationToken ct = default);

    // Admin
    Task<(List<ShowAdminDto> Items, int Total)> GetAllAdminAsync(
        Guid? movieId, Guid? venueId, Guid? screenId,
        DateOnly? fromDate, DateOnly? toDate, string? status,
        int page, int pageSize, CancellationToken ct = default);

    Task<bool> HasConflictAsync(Guid screenId, DateTime showDatetime, Guid? excludeShowId, CancellationToken ct = default);
    Task<int>  CancelAsync(Guid showId, CancellationToken ct = default);
}
