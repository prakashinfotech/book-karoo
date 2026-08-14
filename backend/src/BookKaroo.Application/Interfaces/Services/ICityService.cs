using BookKaroo.Application.DTOs.Cities;

namespace BookKaroo.Application.Interfaces.Services;

public interface ICityService
{
    Task<IEnumerable<CityResponse>> GetAllAsync(CancellationToken ct = default);
    Task<CityResponse?> DetectFromIpAsync(string ip, CancellationToken ct = default);
}
