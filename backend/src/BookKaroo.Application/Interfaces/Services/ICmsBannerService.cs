using BookKaroo.Application.DTOs.Home;

namespace BookKaroo.Application.Interfaces.Services;

public interface ICmsBannerService
{
    Task<IReadOnlyList<BannerResponse>> GetActiveAsync(CancellationToken ct = default);
    void InvalidateCache();
}
