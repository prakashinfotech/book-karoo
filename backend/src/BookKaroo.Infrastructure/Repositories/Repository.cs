using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly BookKarooDbContext _db;

    public Repository(BookKarooDbContext db) => _db = db;

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.Set<T>().FirstOrDefaultAsync(e => e.Id == id, ct);

    public virtual async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Set<T>().ToListAsync(ct);

    public virtual async Task AddAsync(T entity, CancellationToken ct = default)
    {
        await _db.Set<T>().AddAsync(entity, ct);
        await _db.SaveChangesAsync(ct);
    }

    public virtual async Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _db.Set<T>().Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    public virtual async Task SoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await GetByIdAsync(id, ct);
        if (entity == null) return;
        entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
