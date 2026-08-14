using System.Text.Json;

namespace BookKaroo.Application.Interfaces.Services;

public interface ITmdbService
{
    Task<JsonDocument?> GetMovieAsync(int tmdbId, CancellationToken ct = default);
    Task<JsonDocument?> SearchAsync(string query, CancellationToken ct = default);
    Task<JsonDocument?> GetPopularAsync(CancellationToken ct = default);
}
