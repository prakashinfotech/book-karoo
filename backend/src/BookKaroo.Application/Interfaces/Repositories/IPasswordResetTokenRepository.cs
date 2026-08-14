using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IPasswordResetTokenRepository
{
    Task AddAsync(PasswordResetToken token, CancellationToken ct = default);
    Task<PasswordResetToken?> FindValidAsync(string tokenHash, CancellationToken ct = default);
    Task MarkUsedAsync(Guid tokenId, CancellationToken ct = default);
}
