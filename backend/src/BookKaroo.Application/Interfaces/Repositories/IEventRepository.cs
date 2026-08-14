using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IEventRepository : IRepository<Event>
{
    Task<(IEnumerable<Event> Items, int Total)> GetByTypeAsync(
        EventType?        type,
        Guid?             cityId,
        int               page,
        int               pageSize,
        CancellationToken ct = default);

    Task<Event?> FindBySlugAsync(string slug, CancellationToken ct = default);

    Task<Event?> FindSoftDeletedByIdOrSlugAsync(Guid? id, string slug, CancellationToken ct = default);

    Task<IEnumerable<Event>> GetUpcomingByTypeAsync(
        EventType         type,
        Guid?             cityId,
        int               count,
        CancellationToken ct = default);

    Task<(IEnumerable<Event> Items, int Total)> GetAllAdminAsync(
        string?           search,
        EventType?        type,
        MovieStatus?      status,
        int               page,
        int               pageSize,
        CancellationToken ct = default);
}
