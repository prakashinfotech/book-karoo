using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(BookKarooDbContext db) : base(db) { }

    public async Task<User?> FindByEmailAsync(string email, CancellationToken ct = default) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public async Task<User?> FindByMobileAsync(string mobile, CancellationToken ct = default) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Mobile == mobile, ct);

    public async Task<User?> FindByRefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        // Refresh tokens are stored as BCrypt hashes; we must verify in memory.
        var candidates = await _db.Users
            .Where(u => u.RefreshToken != null && u.RefreshTokenExpiresAt > DateTime.UtcNow)
            .ToListAsync(ct);

        return candidates.FirstOrDefault(u =>
            u.RefreshToken != null && BCrypt.Net.BCrypt.Verify(refreshToken, u.RefreshToken));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    public async Task<(List<AdminUserDto> Items, int Total)> GetAllAdminAsync(
        string? search,
        string? role,
        bool?   isBlocked,
        Guid?   cityId,
        int     page,
        int     pageSize,
        CancellationToken ct = default)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(q) ||
                u.Email.ToLower().Contains(q) ||
                u.Mobile.Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, ignoreCase: true, out var roleEnum))
            query = query.Where(u => u.Role == roleEnum);

        if (isBlocked.HasValue)
            query = query.Where(u => u.IsBlocked == isBlocked.Value);

        if (cityId.HasValue)
            query = query.Where(u => u.CityId == cityId.Value);

        var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync(ct);
        var total = users.Count;

        var cityIds = users.Where(u => u.CityId.HasValue).Select(u => u.CityId!.Value).Distinct().ToList();
        var cities  = await _db.Cities.Where(c => cityIds.Contains(c.Id)).ToListAsync(ct);
        var cityDict = cities.ToDictionary(c => c.Id, c => c.Name);

        var userIds = users.Select(u => u.Id).ToList();
        var confirmedBookings = await _db.Bookings
            .Where(b => userIds.Contains(b.UserId) && b.Status == BookingStatus.Confirmed)
            .GroupBy(b => b.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count(), TotalSpent = g.Sum(b => b.AmountPaid) })
            .ToListAsync(ct);

        var bookingStats = confirmedBookings.ToDictionary(x => x.UserId, x => (x.Count, x.TotalSpent));

        var paged = users.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var dtos = paged.Select(u =>
        {
            var stats = bookingStats.TryGetValue(u.Id, out var s) ? s : (Count: 0, TotalSpent: 0m);
            return new AdminUserDto(
                Id:             u.Id,
                Name:           u.Name,
                Email:          u.Email,
                Mobile:         u.Mobile,
                Gender:         u.Gender,
                Dob:            u.Dob,
                CityName:       u.CityId.HasValue && cityDict.TryGetValue(u.CityId.Value, out var cn) ? cn : null,
                StateCode:      u.StateCode,
                Role:           u.Role.ToString(),
                IsBlocked:      u.IsBlocked,
                EmailVerified:  u.EmailVerified,
                TotalBookings:  stats.Count,
                TotalSpent:     stats.TotalSpent,
                CreatedAt:      u.CreatedAt,
                ProfilePicUrl:  u.ProfilePicUrl,
                Preferences:    u.Preferences);
        }).ToList();

        return (dtos, total);
    }

    public async Task<AdminUserDetailDto?> GetUserWithBookingsAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null) return null;

        string? cityName = null;
        if (user.CityId.HasValue)
        {
            var city = await _db.Cities.FirstOrDefaultAsync(c => c.Id == user.CityId.Value, ct);
            cityName = city?.Name;
        }

        var bookings = await _db.Bookings
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .ToListAsync(ct);

        var showIds = bookings.Select(b => b.ShowId).Distinct().ToList();
        var shows   = await _db.Shows.Where(s => showIds.Contains(s.Id)).ToListAsync(ct);
        var venueIds = shows.Select(s => s.VenueId).Distinct().ToList();
        var venues  = await _db.Venues.Where(v => venueIds.Contains(v.Id)).ToListAsync(ct);
        var movieIds = shows.Where(s => s.MovieId.HasValue).Select(s => s.MovieId!.Value).Distinct().ToList();
        var movies  = await _db.Movies.Where(m => movieIds.Contains(m.Id)).ToListAsync(ct);
        var eventIds = shows.Where(s => s.EventId.HasValue).Select(s => s.EventId!.Value).Distinct().ToList();
        var events  = await _db.Events.Where(e => eventIds.Contains(e.Id)).ToListAsync(ct);

        var showDict  = shows .ToDictionary(s => s.Id);
        var venueDict = venues.ToDictionary(v => v.Id);
        var movieDict = movies.ToDictionary(m => m.Id);
        var eventDict = events.ToDictionary(e => e.Id);

        var confirmedCount = await _db.Bookings
            .Where(b => b.UserId == userId && b.Status == BookingStatus.Confirmed)
            .CountAsync(ct);
        var totalSpent = await _db.Bookings
            .Where(b => b.UserId == userId && b.Status == BookingStatus.Confirmed)
            .SumAsync(b => b.AmountPaid, ct);

        var recentBookings = bookings.Select(b =>
        {
            var show = b.ShowId.HasValue && showDict.TryGetValue(b.ShowId.Value, out var s) ? s : null;
            var venue = show != null && venueDict.TryGetValue(show.VenueId, out var v) ? v : null;
            var movie = show?.MovieId.HasValue == true && movieDict.TryGetValue(show.MovieId!.Value, out var m) ? m : null;
            var ev    = show?.EventId.HasValue == true && eventDict.TryGetValue(show.EventId!.Value, out var e) ? e : null;

            return new AdminUserBookingSummaryDto(
                BookingRef: b.BookingRef,
                Status:     b.Status.ToString(),
                AmountPaid: b.AmountPaid,
                CreatedAt:  b.CreatedAt,
                TicketQty:  b.TicketQty,
                MovieTitle: movie?.Title,
                EventTitle: ev?.Title,
                ShowDate:   show?.ShowDate ?? default,
                ShowTime:   show?.ShowTime ?? default,
                VenueName:  venue?.Name ?? string.Empty);
        }).ToList();

        return new AdminUserDetailDto(
            Id:             user.Id,
            Name:           user.Name,
            Email:          user.Email,
            Mobile:         user.Mobile,
            Gender:         user.Gender,
            Dob:            user.Dob,
            CityName:       cityName,
            StateCode:      user.StateCode,
            Role:           user.Role.ToString(),
            IsBlocked:      user.IsBlocked,
            EmailVerified:  user.EmailVerified,
            TotalBookings:  confirmedCount,
            TotalSpent:     totalSpent,
            CreatedAt:      user.CreatedAt,
            ProfilePicUrl:  user.ProfilePicUrl,
            Preferences:    user.Preferences,
            RecentBookings: recentBookings);
    }

    public async Task BlockUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException($"User {userId} not found.");
        user.IsBlocked = true;
        await _db.SaveChangesAsync(ct);
    }

    public async Task UnblockUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException($"User {userId} not found.");
        user.IsBlocked = false;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<string> AdminResetPasswordAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException($"User {userId} not found.");

        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = new Random();
        var suffix = new string(Enumerable.Range(0, 8).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
        var tempPassword = "BK-" + suffix;

        user.PasswordHash              = BCrypt.Net.BCrypt.HashPassword(tempPassword, workFactor: 12);
        user.RefreshToken              = null;
        user.RefreshTokenExpiresAt     = null;

        await _db.SaveChangesAsync(ct);
        return tempPassword;
    }
}
