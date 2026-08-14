using BookKaroo.Application.DTOs.Lys;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class LysOrganizerRepository : ILysOrganizerRepository
{
    private readonly BookKarooDbContext _db;
    public LysOrganizerRepository(BookKarooDbContext db) => _db = db;

    public async Task<LysOrganizer?> GetByUserIdAsync(Guid userId, CancellationToken ct) =>
        await _db.LysOrganizers.FirstOrDefaultAsync(o => o.UserId == userId, ct);

    public async Task<LysOrganizer?> GetByIdAsync(Guid id, CancellationToken ct) =>
        await _db.LysOrganizers.FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<bool> PanExistsAsync(string pan, Guid? excludeId, CancellationToken ct) =>
        await _db.LysOrganizers
            .AnyAsync(o => o.PanNumber == pan && (excludeId == null || o.Id != excludeId), ct);

    public async Task<LysOrganizer> AddAsync(LysOrganizer organizer, CancellationToken ct)
    {
        await _db.LysOrganizers.AddAsync(organizer, ct);
        await _db.SaveChangesAsync(ct);
        return organizer;
    }

    public async Task UpdateAsync(LysOrganizer organizer, CancellationToken ct)
    {
        _db.LysOrganizers.Update(organizer);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<(List<LysOrganizerAdminDto> Items, int Total)> GetAllAdminAsync(
        string? search, bool? isVerified, int page, int pageSize, CancellationToken ct)
    {
        var query = _db.LysOrganizers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(o =>
                EF.Functions.ILike(o.Name, $"%{search}%") ||
                EF.Functions.ILike(o.Email, $"%{search}%") ||
                EF.Functions.ILike(o.PanNumber, $"%{search}%"));

        if (isVerified.HasValue)
            query = query.Where(o => o.IsVerified == isVerified.Value);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new LysOrganizerAdminDto
            {
                Id         = o.Id,
                UserId     = o.UserId,
                Name       = o.Name,
                Email      = o.Email,
                Phone      = o.Phone,
                PanNumber  = o.PanNumber,
                IsVerified = o.IsVerified,
                IsActive   = o.IsActive,
                VerifiedAt = o.VerifiedAt,
                EventCount = _db.LysEvents.Count(e => e.OrganizerId == o.Id),
                PublishedEventCount = _db.LysEvents.Count(e => e.OrganizerId == o.Id && e.Status == "published"),
                CreatedAt  = o.CreatedAt,
            })
            .ToListAsync(ct);

        return (items, total);
    }
}
