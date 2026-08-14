using BookKaroo.Application.DTOs.Lys;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface ILysOrganizerRepository
{
    Task<LysOrganizer?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<LysOrganizer?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> PanExistsAsync(string pan, Guid? excludeId, CancellationToken ct = default);
    Task<LysOrganizer> AddAsync(LysOrganizer organizer, CancellationToken ct = default);
    Task UpdateAsync(LysOrganizer organizer, CancellationToken ct = default);
    Task<(List<LysOrganizerAdminDto> Items, int Total)> GetAllAdminAsync(
        string? search, bool? isVerified, int page, int pageSize, CancellationToken ct = default);
}
