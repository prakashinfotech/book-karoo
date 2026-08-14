using System.Net;
using System.Text.Json;
using BookKaroo.Application.DTOs.Cities;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;

namespace BookKaroo.Application.Services;

public class CityService : ICityService
{
    private readonly ICityRepository    _cities;
    private readonly IHttpClientFactory _http;
    private readonly IMemoryCache       _cache;

    private const string CacheKey   = "cities:all";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(24);

    public CityService(ICityRepository cities, IHttpClientFactory http, IMemoryCache cache)
    {
        _cities = cities;
        _http   = http;
        _cache  = cache;
    }

    public async Task<IEnumerable<CityResponse>> GetAllAsync(CancellationToken ct = default)
    {
        return await _cache.GetOrCreateAsync(CacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheTtl;
            var cities = await _cities.GetActiveAsync(ct);
            return cities
                .OrderBy(c => c.Name)
                .Select(c => new CityResponse(c.Id, c.Name, c.Slug, c.State, c.StateCode, c.Latitude, c.Longitude))
                .ToList()
                .AsEnumerable();
        }) ?? Enumerable.Empty<CityResponse>();
    }

    public async Task<CityResponse?> DetectFromIpAsync(string ip, CancellationToken ct = default)
    {
        try
        {
            var client = _http.CreateClient();

            // For loopback/private IPs (local dev), call ip-api without an IP so it
            // auto-detects using the server's own outbound address (≈ developer's real IP).
            var apiUrl = IsPrivateOrLoopback(ip)
                ? "http://ip-api.com/json?fields=city,status"
                : $"http://ip-api.com/json/{ip}?fields=city,status";

            var response = await client.GetStringAsync(apiUrl, ct);
            var doc = JsonDocument.Parse(response);

            // ip-api returns {status:"fail"} for unresolvable IPs
            if (doc.RootElement.TryGetProperty("status", out var statusProp)
                && statusProp.GetString() == "fail")
                return null;

            if (!doc.RootElement.TryGetProperty("city", out var cityProp)) return null;
            var cityName = cityProp.GetString();
            if (string.IsNullOrWhiteSpace(cityName)) return null;

            // Use cached cities list for lookups — avoids repeated DB hits
            var allCities = (await GetAllAsync(ct)).ToList();

            // Exact match first
            var city = allCities.FirstOrDefault(c =>
                c.Name.Equals(cityName, StringComparison.OrdinalIgnoreCase));

            // Fallback: partial match (handles "New Delhi" → "Delhi-NCR" etc.)
            city ??= allCities.FirstOrDefault(c =>
                c.Name.Contains(cityName, StringComparison.OrdinalIgnoreCase) ||
                cityName.Contains(c.Name, StringComparison.OrdinalIgnoreCase));

            return city;
        }
        catch
        {
            return null;
        }
    }

    private static bool IsPrivateOrLoopback(string ip)
    {
        if (ip is "::1" or "127.0.0.1" or "0.0.0.0" or "::ffff:127.0.0.1") return true;
        if (!IPAddress.TryParse(ip, out var addr)) return true;
        var mapped = addr.MapToIPv4().GetAddressBytes();
        return mapped[0] == 10
            || (mapped[0] == 172 && mapped[1] >= 16 && mapped[1] <= 31)
            || (mapped[0] == 192 && mapped[1] == 168);
    }
}
