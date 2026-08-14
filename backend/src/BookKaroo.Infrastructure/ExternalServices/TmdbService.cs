using System.Net.Http.Headers;
using System.Text.Json;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Infrastructure.ExternalServices;

public class TmdbService : ITmdbService
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<TmdbService> _logger;

    public TmdbService(IHttpClientFactory http, IConfiguration config, ILogger<TmdbService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    private HttpClient CreateClient()
    {
        var client = _http.CreateClient("tmdb");
        var bearer = _config["TMDB_BEARER"];
        if (!string.IsNullOrEmpty(bearer))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
        return client;
    }

    public async Task<JsonDocument?> GetMovieAsync(int tmdbId, CancellationToken ct = default)
    {
        try
        {
            var client = CreateClient();
            var response = await client.GetStringAsync(
                $"https://api.themoviedb.org/3/movie/{tmdbId}?append_to_response=credits,videos", ct);
            return JsonDocument.Parse(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TMDB GetMovie failed for ID {TmdbId}", tmdbId);
            return null;
        }
    }

    public async Task<JsonDocument?> SearchAsync(string query, CancellationToken ct = default)
    {
        try
        {
            var client = CreateClient();
            var response = await client.GetStringAsync(
                $"https://api.themoviedb.org/3/search/movie?query={Uri.EscapeDataString(query)}", ct);
            return JsonDocument.Parse(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TMDB Search failed for query {Query}", query);
            return null;
        }
    }

    public async Task<JsonDocument?> GetPopularAsync(CancellationToken ct = default)
    {
        try
        {
            var client = CreateClient();
            var response = await client.GetStringAsync("https://api.themoviedb.org/3/movie/popular", ct);
            return JsonDocument.Parse(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TMDB GetPopular failed");
            return null;
        }
    }
}
