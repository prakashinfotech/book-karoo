using BookKaroo.Application.DTOs.Lys;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface ILysEventRepository
{
    Task<LysEvent?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<LysEvent?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<LysEvent> AddAsync(LysEvent ev, CancellationToken ct = default);
    Task UpdateAsync(LysEvent ev, CancellationToken ct = default);
    Task SoftDeleteAsync(Guid id, CancellationToken ct = default);

    Task<(List<LysEvent> Items, int Total)> GetByOrganizerAsync(
        Guid organizerId, string? status, int page, int pageSize, CancellationToken ct = default);

    Task<(List<LysEventAdminDto> Items, int Total)> GetAllAdminAsync(
        string? search, string? status, string? type,
        DateOnly? fromDate, DateOnly? toDate,
        int page, int pageSize, CancellationToken ct = default);

    Task<List<LysEvent>> CheckDuplicatesAsync(
        Guid organizerId, string title, DateTime eventDate, CancellationToken ct = default);

    Task<bool> SlugExistsAsync(string slug, CancellationToken ct = default);

    Task<(bool HasActivePartner, Guid? PartnerId, string? PartnerEmail, string? PartnerName)>
        DetectVenuePartnerAsync(Guid venueId, CancellationToken ct = default);

    Task<(List<LysEvent> Items, int Total)> GetByPartnerAsync(
        Guid partnerId, List<Guid> venueIds, string? status,
        int page, int pageSize, CancellationToken ct = default);

    Task<int> GetPendingCountForPartnerAsync(
        Guid partnerId, List<Guid> venueIds, CancellationToken ct = default);
}
