using BookKaroo.Application.DTOs.Lys;

namespace BookKaroo.Application.Interfaces.Services;

public interface ILysOrganizerService
{
    Task<LysOrganizerResponse> RegisterAsync(RegisterOrganizerRequest req, Guid userId, CancellationToken ct = default);
    Task<LysOrganizerResponse?> GetMyProfileAsync(Guid userId, CancellationToken ct = default);
    Task<LysOrganizerResponse> UpdateProfileAsync(Guid userId, UpdateOrganizerRequest req, CancellationToken ct = default);
    Task<bool> IsOrganizerAsync(Guid userId, CancellationToken ct = default);
}
