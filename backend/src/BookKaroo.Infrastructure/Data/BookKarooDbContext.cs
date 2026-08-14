using BookKaroo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using PaymentEntity = BookKaroo.Domain.Entities.Payment;

namespace BookKaroo.Infrastructure.Data;

public class BookKarooDbContext : DbContext
{
    public BookKarooDbContext(DbContextOptions<BookKarooDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<Screen> Screens => Set<Screen>();
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Show> Shows => Set<Show>();
    public DbSet<SeatLock> SeatLocks => Set<SeatLock>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingSeat> BookingSeats => Set<BookingSeat>();
    public DbSet<PaymentEntity> Payments => Set<PaymentEntity>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<CmsBanner> CmsBanners => Set<CmsBanner>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<RemindMe> RemindMes => Set<RemindMe>();
    public DbSet<CouponUsage> CouponUsages => Set<CouponUsage>();
    public DbSet<IdempotencyKey> IdempotencyKeys => Set<IdempotencyKey>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EventTicketLock> EventTicketLocks => Set<EventTicketLock>();
    public DbSet<PartnerProfile> PartnerProfiles => Set<PartnerProfile>();
    public DbSet<PartnerVenueAccess> PartnerVenueAccesses => Set<PartnerVenueAccess>();
    public DbSet<LysOrganizer> LysOrganizers => Set<LysOrganizer>();
    public DbSet<LysEvent>     LysEvents     => Set<LysEvent>();
    public DbSet<LysUpload>    LysUploads    => Set<LysUpload>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Setting — string PK ────────────────────────────────────────────────
        modelBuilder.Entity<Setting>(e =>
        {
            e.HasKey(s => s.Key);
            e.Property(s => s.Key).HasMaxLength(100);
            e.Property(s => s.Value).HasColumnType("text");
        });

        // ── AuditLog — no UpdatedAt / DeletedAt, custom PK ──────────────────
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Before).HasColumnType("text");
            e.Property(a => a.After).HasColumnType("text");
            e.HasIndex(a => a.UserId);
            e.HasIndex(a => a.EntityType);
        });

        // ── SeatLock — no UpdatedAt / DeletedAt ───────────────────────────────
        modelBuilder.Entity<SeatLock>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.ShowId);
            e.HasIndex(s => new { s.ShowId, s.SeatLabel });
        });

        // ── BookingSeat — no UpdatedAt / DeletedAt ────────────────────────────
        modelBuilder.Entity<BookingSeat>(e =>
        {
            e.HasKey(b => b.Id);
            e.HasIndex(b => b.BookingId);
            e.Property(b => b.Price).HasColumnType("numeric(10,2)");
        });

        // ── IdempotencyKey — string PK ────────────────────────────────────────
        modelBuilder.Entity<IdempotencyKey>(e =>
        {
            e.HasKey(i => i.Key);
            e.Property(i => i.Key).HasMaxLength(200);
            e.Property(i => i.Response).HasColumnType("text");
            e.HasIndex(i => i.UserId);
        });

        // ── PasswordResetToken ────────────────────────────────────────────────
        modelBuilder.Entity<PasswordResetToken>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.TokenHash);
            e.HasIndex(p => p.UserId);
            // Soft-delete filter
            e.HasQueryFilter(p => p.DeletedAt == null);
        });

        // ── User ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            // Partial unique index: allow re-signup with a soft-deleted user's email
            e.HasIndex(u => u.Email).IsUnique().HasFilter("\"deleted_at\" IS NULL");
            e.HasIndex(u => u.Mobile);
            e.HasIndex(u => u.CityId);
            e.HasQueryFilter(u => u.DeletedAt == null);
            e.Property(u => u.Preferences).HasColumnType("text");
        });

        // ── City ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<City>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.Slug).IsUnique();
            e.HasQueryFilter(c => c.DeletedAt == null);
        });

        // ── Venue ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Venue>(e =>
        {
            e.HasKey(v => v.Id);
            e.HasIndex(v => v.Slug).IsUnique();
            e.HasIndex(v => v.CityId);
            e.HasQueryFilter(v => v.DeletedAt == null);
            e.Property(v => v.Amenities).HasColumnType("text");
        });

        // ── Screen ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Screen>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.VenueId);
            e.HasQueryFilter(s => s.DeletedAt == null);
            e.Property(s => s.Layout).HasColumnType("text");
        });

        // ── Movie ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Movie>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasIndex(m => m.Slug).IsUnique();
            e.HasQueryFilter(m => m.DeletedAt == null);
            // "cast" is a reserved SQL word → remap
            e.Property(m => m.Cast).HasColumnName("movie_cast").HasColumnType("text");
            e.Property(m => m.Crew).HasColumnType("text");
            e.Property(m => m.ImdbRating).HasColumnType("numeric(4,1)");
            e.Property(m => m.Languages).HasColumnType("text[]");
            e.Property(m => m.Formats).HasColumnType("text[]");
            e.Property(m => m.Genres).HasColumnType("text[]");
        });

        // ── Event ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<Event>(e =>
        {
            e.HasKey(ev => ev.Id);
            e.HasIndex(ev => ev.Slug).IsUnique();
            e.HasIndex(ev => ev.VenueId);
            e.HasQueryFilter(ev => ev.DeletedAt == null);
            e.Property(ev => ev.Organizer).HasColumnType("text");
            e.Property(ev => ev.Artists).HasColumnType("text");
            e.Property(ev => ev.PriceTiers).HasColumnType("text");
        });

        // ── Show ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<Show>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.ScreenId);
            e.HasIndex(s => s.VenueId);
            e.HasIndex(s => s.MovieId);
            e.HasIndex(s => s.EventId);
            e.HasIndex(s => new { s.MovieId, s.ShowDate });
            e.HasQueryFilter(s => s.DeletedAt == null);
            e.Property(s => s.PriceOverrides).HasColumnType("text");
        });

        // ── Coupon ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Coupon>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.Code).IsUnique();
            e.HasQueryFilter(c => c.DeletedAt == null);
            e.Property(c => c.Value).HasColumnType("numeric(10,2)");
            e.Property(c => c.MaxDiscount).HasColumnType("numeric(10,2)");
            e.Property(c => c.MinOrder).HasColumnType("numeric(10,2)");
            e.Property(c => c.ApplicableCities).HasColumnType("uuid[]");
            e.Property(c => c.ApplicableMovies).HasColumnType("uuid[]");
            e.Property(c => c.ApplicableVenues).HasColumnType("uuid[]");
        });

        // ── EventTicketLock — no soft-delete (no DeletedAt) ──────────────────
        modelBuilder.Entity<EventTicketLock>(e =>
        {
            e.HasKey(etl => etl.Id);
            e.ToTable("EventTicketLocks");
            e.HasIndex(etl => etl.EventId);
            e.HasIndex(etl => new { etl.EventId, etl.TierName });
            e.HasIndex(etl => etl.UserId);
        });

        // ── Booking ───────────────────────────────────────────────────────────
        modelBuilder.Entity<Booking>(e =>
        {
            e.HasKey(b => b.Id);
            e.HasIndex(b => b.BookingRef).IsUnique();
            e.HasIndex(b => b.UserId);
            e.HasIndex(b => b.ShowId);
            e.HasIndex(b => b.EventId);
            e.HasIndex(b => b.CouponId);
            e.HasQueryFilter(b => b.DeletedAt == null);
            e.Property(b => b.TicketAmount).HasColumnType("numeric(10,2)");
            e.Property(b => b.ConvenienceFee).HasColumnType("numeric(10,2)");
            e.Property(b => b.OfferProcessingFee).HasColumnType("numeric(10,2)");
            e.Property(b => b.TaxableAmount).HasColumnType("numeric(10,2)");
            e.Property(b => b.Cgst).HasColumnType("numeric(10,2)");
            e.Property(b => b.Sgst).HasColumnType("numeric(10,2)");
            e.Property(b => b.Igst).HasColumnType("numeric(10,2)");
            e.Property(b => b.Discount).HasColumnType("numeric(10,2)");
            e.Property(b => b.AmountPaid).HasColumnType("numeric(10,2)");
        });

        // ── Payment ───────────────────────────────────────────────────────────
        modelBuilder.Entity<PaymentEntity>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.BookingId);
            e.HasIndex(p => p.ProviderOrderId);
            e.HasIndex(p => p.IdempotencyKey);
            e.HasQueryFilter(p => p.DeletedAt == null);
            e.Property(p => p.Amount).HasColumnType("numeric(10,2)");
            e.Property(p => p.RefundAmount).HasColumnType("numeric(10,2)");
            e.Property(p => p.ProviderPayload).HasColumnType("text");
        });

        // ── Review ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Review>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.UserId);
            e.HasIndex(r => r.MovieId);
            e.HasIndex(r => r.EventId);
            e.HasQueryFilter(r => r.DeletedAt == null);
        });

        // ── Notification ──────────────────────────────────────────────────────
        modelBuilder.Entity<Notification>(e =>
        {
            e.HasKey(n => n.Id);
            e.HasIndex(n => n.UserId);
            e.HasQueryFilter(n => n.DeletedAt == null);
            e.Property(n => n.Data).HasColumnType("text");
            e.Property(n => n.SentVia).HasColumnType("text[]");
        });

        // ── CmsBanner ─────────────────────────────────────────────────────────
        modelBuilder.Entity<CmsBanner>(e =>
        {
            e.HasKey(b => b.Id);
            e.HasQueryFilter(b => b.DeletedAt == null);
        });

        // ── RemindMe ─────────────────────────────────────────────────────────
        modelBuilder.Entity<RemindMe>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.UserId);
            e.HasIndex(r => r.MovieId);
            e.HasQueryFilter(r => r.DeletedAt == null);
        });

        // ── CouponUsage ───────────────────────────────────────────────────────
        modelBuilder.Entity<CouponUsage>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.CouponId);
            e.HasIndex(c => c.UserId);
            e.HasIndex(c => c.BookingId);
            e.HasQueryFilter(c => c.DeletedAt == null);
        });

        // ── PartnerProfile ────────────────────────────────────────────────────
        modelBuilder.Entity<PartnerProfile>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasQueryFilter(p => p.DeletedAt == null);
            e.HasIndex(p => p.UserId)
             .HasFilter("\"DeletedAt\" IS NULL")
             .IsUnique();
            e.HasIndex(p => p.IsActive);
        });

        // ── PartnerVenueAccess ────────────────────────────────────────────────
        modelBuilder.Entity<PartnerVenueAccess>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => new { p.PartnerId, p.VenueId }).IsUnique();
            e.HasIndex(p => p.PartnerId);
            e.HasIndex(p => p.VenueId);
        });

        // ── LysOrganizer ──────────────────────────────────────────────────────
        modelBuilder.Entity<LysOrganizer>(e =>
        {
            e.HasKey(o => o.Id);
            e.HasIndex(o => o.UserId)
             .HasFilter("\"DeletedAt\" IS NULL")
             .IsUnique();
            e.HasIndex(o => o.PanNumber)
             .HasFilter("\"DeletedAt\" IS NULL")
             .IsUnique();
            e.HasQueryFilter(o => o.DeletedAt == null);
        });

        // ── LysEvent ──────────────────────────────────────────────────────────
        modelBuilder.Entity<LysEvent>(e =>
        {
            e.HasKey(ev => ev.Id);
            e.HasIndex(ev => ev.Slug)
             .HasFilter("\"DeletedAt\" IS NULL")
             .IsUnique();
            e.HasIndex(ev => ev.OrganizerId);
            e.HasIndex(ev => ev.Status);
            e.HasQueryFilter(ev => ev.DeletedAt == null);
            e.Property(ev => ev.CommissionRate).HasColumnType("numeric(5,2)");
            e.Property(ev => ev.ArtistsJson).HasColumnType("text");
            e.Property(ev => ev.PriceTiersJson).HasColumnType("text");
        });

        // ── LysUpload — no soft-delete ────────────────────────────────────────
        modelBuilder.Entity<LysUpload>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.OrganizerId);
        });

        // ── Booking — add LYS commission columns ──────────────────────────────
        modelBuilder.Entity<Booking>(e =>
        {
            e.Property(b => b.CommissionAmount).HasColumnType("numeric(10,2)");
            e.Property(b => b.CommissionRate).HasColumnType("numeric(5,2)");
            e.HasIndex(b => b.LysEventId).HasFilter("\"LysEventId\" IS NOT NULL");
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is Domain.Entities.BaseEntity entity)
            {
                if (entry.State == EntityState.Added)
                    entity.CreatedAt = now;
                if (entry.State is EntityState.Added or EntityState.Modified)
                    entity.UpdatedAt = now;
            }
            if (entry.Entity is Setting setting && entry.State == EntityState.Modified)
                setting.UpdatedAt = now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
