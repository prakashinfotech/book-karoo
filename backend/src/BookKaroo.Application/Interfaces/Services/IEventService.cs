using BookKaroo.Application.DTOs.Events;
using BookKaroo.Domain.Enums;

namespace BookKaroo.Application.Interfaces.Services;

public interface IEventService
{
    Task<(IReadOnlyList<EventListResponse> Items, int Total, int TotalPages)> GetListAsync(
        EventType? type,
        Guid?      cityId,
        int        page,
        int        pageSize,
        CancellationToken ct = default);

    Task<EventDetailResponse> GetDetailAsync(string slug, CancellationToken ct = default);

    Task<IReadOnlyList<EventListResponse>> GetByTypeAsync(
        EventType         type,
        Guid?             cityId,
        int               count,
        CancellationToken ct = default);
}
