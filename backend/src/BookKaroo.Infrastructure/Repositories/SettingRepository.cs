using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class SettingRepository : ISettingRepository
{
    private readonly BookKarooDbContext _db;
    public SettingRepository(BookKarooDbContext db) => _db = db;

    public async Task<string?> GetAsync(string key, CancellationToken ct = default)
    {
        var s = await _db.Settings.FindAsync([key], ct);
        return s?.Value;
    }

    public async Task SetAsync(string key, string value, CancellationToken ct = default)
    {
        var existing = await _db.Settings.FindAsync([key], ct);
        if (existing == null)
            await _db.Settings.AddAsync(new Setting { Key = key, Value = value }, ct);
        else
            existing.Value = value;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<Dictionary<string, string>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Settings.ToDictionaryAsync(s => s.Key, s => s.Value, ct);
}
