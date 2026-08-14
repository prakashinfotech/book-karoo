using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class CouponRepository : Repository<Coupon>, ICouponRepository
{
    public CouponRepository(BookKarooDbContext db) : base(db) { }

    public async Task<Coupon?> FindByCodeAsync(string code, CancellationToken ct = default) =>
        await _db.Coupons.FirstOrDefaultAsync(c => c.Code == code.ToUpperInvariant(), ct);
}
