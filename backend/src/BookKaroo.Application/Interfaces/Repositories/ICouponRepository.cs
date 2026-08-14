using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface ICouponRepository : IRepository<Coupon>
{
    Task<Coupon?> FindByCodeAsync(string code, CancellationToken ct = default);
}
