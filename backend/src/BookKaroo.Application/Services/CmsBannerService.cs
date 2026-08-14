using BookKaroo.Application.DTOs.Home;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;

namespace BookKaroo.Application.Services;

public class CmsBannerService : ICmsBannerService
{
    private readonly ICmsBannerRepository _banners;
    private readonly IMemoryCache         _cache;

    private const string CacheKey = "cms:banners:active";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public CmsBannerService(ICmsBannerRepository banners, IMemoryCache cache)
    {
        _banners = banners;
        _cache   = cache;
    }

    public async Task<IReadOnlyList<BannerResponse>> GetActiveAsync(CancellationToken ct = default)
    {
        var result = await _cache.GetOrCreateAsync(CacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheTtl;
            var banners = await _banners.GetActiveAsync(ct);
            return banners
                .Select(b => new BannerResponse(b.Id, b.Title, b.ImageUrl, b.LinkUrl, b.Position))
                .ToList();
        });

        return result ?? [];
    }

    /// <summary>
    /// Call after any banner create/update/delete to surface changes within seconds.
    /// </summary>
    public void InvalidateCache() => _cache.Remove(CacheKey);
}
