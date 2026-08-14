using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class PasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly BookKarooDbContext _db;
    public PasswordResetTokenRepository(BookKarooDbContext db) => _db = db;

    public async Task AddAsync(PasswordResetToken token, CancellationToken ct = default)
    {
        await _db.PasswordResetTokens.AddAsync(token, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PasswordResetToken?> FindValidAsync(string tokenHash, CancellationToken ct = default) =>
        await _db.PasswordResetTokens
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t =>
                t.TokenHash == tokenHash &&
                !t.IsUsed &&
                t.ExpiresAt > DateTime.UtcNow &&
                t.DeletedAt == null, ct);

    public async Task MarkUsedAsync(Guid tokenId, CancellationToken ct = default)
    {
        var token = await _db.PasswordResetTokens.FindAsync([tokenId], ct);
        if (token == null) return;
        token.IsUsed = true;
        await _db.SaveChangesAsync(ct);
    }
}
