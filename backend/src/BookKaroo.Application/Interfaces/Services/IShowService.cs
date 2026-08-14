using BookKaroo.Application.DTOs.Shows;

namespace BookKaroo.Application.Interfaces.Services;

public interface IShowService
{
    Task<ShowtimesGroupedResponse> GetShowtimesAsync(Guid movieId, Guid cityId, DateOnly date, CancellationToken ct = default);
    Task<ShowSeatsResponse>        GetSeatsAsync(Guid showId, CancellationToken ct = default);
}
