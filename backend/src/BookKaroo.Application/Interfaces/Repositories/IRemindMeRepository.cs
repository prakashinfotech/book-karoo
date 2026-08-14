using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IRemindMeRepository : IRepository<RemindMe>
{
    Task<IEnumerable<RemindMe>> GetByMovieAsync(Guid movieId, CancellationToken ct = default);
    Task<bool> HasOptedInAsync(Guid userId, Guid movieId, CancellationToken ct = default);
    Task<bool> HasOptedInForEventAsync(Guid userId, Guid eventId, CancellationToken ct = default);
}
