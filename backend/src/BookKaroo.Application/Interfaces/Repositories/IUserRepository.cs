using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> FindByMobileAsync(string mobile, CancellationToken ct = default);
    Task<User?> FindByRefreshTokenAsync(string refreshToken, CancellationToken ct = default);

    // Admin
    Task<(List<AdminUserDto> Items, int Total)> GetAllAdminAsync(
        string? search,
        string? role,
        bool?   isBlocked,
        Guid?   cityId,
        int     page,
        int     pageSize,
        CancellationToken ct = default);

    Task<AdminUserDetailDto?> GetUserWithBookingsAsync(Guid userId, CancellationToken ct = default);

    Task BlockUserAsync(Guid userId, CancellationToken ct = default);
    Task UnblockUserAsync(Guid userId, CancellationToken ct = default);
    Task<string> AdminResetPasswordAsync(Guid userId, CancellationToken ct = default);
}
