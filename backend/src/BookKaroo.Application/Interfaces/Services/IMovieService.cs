using BookKaroo.Application.DTOs.Movies;

namespace BookKaroo.Application.Interfaces.Services;

public interface IMovieService
{
    Task<MovieListPagedResponse> GetListAsync(MovieFilterRequest filter, CancellationToken ct = default);
    Task<MovieDetailResponse>   GetDetailAsync(string slug, Guid? userId, CancellationToken ct = default);
    Task<ShowtimesResponse>     GetShowtimesAsync(string slug, string? date, CancellationToken ct = default);
}
