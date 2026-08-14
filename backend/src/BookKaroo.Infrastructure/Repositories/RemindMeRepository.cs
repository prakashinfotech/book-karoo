using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class RemindMeRepository : Repository<RemindMe>, IRemindMeRepository
{
    public RemindMeRepository(BookKarooDbContext db) : base(db) { }

    public async Task<IEnumerable<RemindMe>> GetByMovieAsync(Guid movieId, CancellationToken ct = default) =>
        await _db.RemindMes.Where(r => r.MovieId == movieId && !r.Notified).ToListAsync(ct);

    public async Task<bool> HasOptedInAsync(Guid userId, Guid movieId, CancellationToken ct = default) =>
        await _db.RemindMes.AnyAsync(r => r.UserId == userId && r.MovieId == movieId, ct);

    public async Task<bool> HasOptedInForEventAsync(Guid userId, Guid eventId, CancellationToken ct = default) =>
        await _db.RemindMes.AnyAsync(r => r.UserId == userId && r.EventId == eventId, ct);
}
