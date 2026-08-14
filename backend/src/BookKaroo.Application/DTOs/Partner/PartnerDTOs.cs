namespace BookKaroo.Application.DTOs.Partner;

// ── Dashboard ─────────────────────────────────────────────────────────────
public record PartnerDashboardResponse(
    string PartnerName,
    List<string> VenueNames,
    int TodayBookings,
    decimal TodayRevenue,
    decimal WeekRevenue,
    decimal MonthRevenue,
    int TotalBookingsAllTime,
    int UpcomingShows,
    List<DailyBookingStat> BookingsPerDay,
    List<VenueRevenueStat> RevenuePerVenue,
    List<RecentPartnerBooking> RecentBookings,
    decimal OccupancyRate
);
public record DailyBookingStat(string Date, int Count);
public record VenueRevenueStat(string VenueName, decimal Revenue);
public record RecentPartnerBooking(
    string BookingRef, string MovieOrEventTitle, string VenueName,
    decimal AmountPaid, string Status, DateTime CreatedAt);

// ── Venue ─────────────────────────────────────────────────────────────────
public record PartnerVenueListItem(
    Guid Id, string Name, string Address, string CityName,
    bool IsActive, string? ContactPhone, string? ContactEmail,
    int ScreenCount);

public record PartnerVenueDetail(
    Guid Id, string Name, string Slug, string Address, Guid CityId, string CityName,
    string? Chain, string? Amenities, bool IsActive,
    string? ContactPhone, string? ContactEmail,
    List<PartnerScreenInfo> Screens);

public record PartnerScreenInfo(
    Guid Id, string Name, int TotalSeats, string? Layout);

public record UpdateVenueOperationalRequest(
    string? ContactPhone, string? ContactEmail, string? Amenities);

public record CreateScreenRequest(
    string Name, int TotalSeats, string? Layout);

public record UpdateScreenRequest(
    string? Name, int? TotalSeats, string? Layout);

// ── Show ──────────────────────────────────────────────────────────────────
public record PartnerShowResponse(
    Guid Id, Guid VenueId, string VenueName, Guid ScreenId, string ScreenName,
    Guid? MovieId, string? MovieTitle, Guid? EventId, string? EventTitle,
    DateOnly ShowDate, TimeOnly ShowTime, string? Format, string? Language,
    string Status, int BookedSeats);

public record CreatePartnerShowRequest(
    Guid VenueId, Guid ScreenId, Guid? MovieId, Guid? EventId,
    DateOnly ShowDate, TimeOnly ShowTime, string? Format, string? Language,
    string? PriceOverrides);

// ── Booking ───────────────────────────────────────────────────────────────
public record PartnerBookingListItem(
    string BookingRef, Guid UserId, string UserName,
    string MovieOrEventTitle, string VenueName, string ScreenName,
    DateTime ShowDatetime, int TicketQty, decimal AmountPaid,
    string Status, DateTime CreatedAt);

public record PartnerBookingDetail(
    string BookingRef, Guid UserId, string UserName, string UserEmail,
    string MovieOrEventTitle, string VenueName, string ScreenName,
    DateTime ShowDatetime, int TicketQty,
    List<string> Seats, decimal TicketAmount, decimal ConvenienceFee,
    decimal Discount, decimal AmountPaid, string Status,
    DateTime CreatedAt, DateTime? CancelledAt);

public record PartnerBookingPage(
    List<PartnerBookingListItem> Items, int Total, int Page, int PageSize, int TotalPages,
    int ConfirmedCount, int CancelledCount, decimal TotalRevenue);

// ── Reports ───────────────────────────────────────────────────────────────
public record PartnerReportResponse(
    int TotalBookings, decimal TotalRevenue,
    List<DailyBookingStat> BookingsPerDay,
    List<VenueRevenueStat> RevenuePerVenue,
    List<RecentPartnerBooking> RecentBookings);

// ── Review ────────────────────────────────────────────────────────────────
public record PartnerReviewResponse(
    Guid Id, int Rating, string? Title, string? Body,
    string UserName, bool IsVerifiedBooking,
    string MovieTitle, string? MoviePosterUrl,
    int ThumbsUp, int ThumbsDown, string Status,
    DateTime CreatedAt, string VenueName);

public record PartnerReviewPage(
    List<PartnerReviewResponse> Items, int Total, int Page, int PageSize);

// ── Admin Partner Management ──────────────────────────────────────────────
public record AdminPartnerVenueAccess(
    Guid VenueId, string VenueName, string CityName, DateTime GrantedAt, string? ContactPhone, string? ContactEmail);

public record AdminPartnerResponse(
    Guid Id, Guid UserId, string UserName, string UserEmail, string? UserMobile,
    string BusinessName, string ContactPerson, string ContactPhone, string ContactEmail,
    string? GstNumber, string? PanNumber, string? Notes, bool IsActive,
    List<AdminPartnerVenueAccess> VenueAccess,
    DateTime CreatedAt);

public record AdminPartnerPage(
    List<AdminPartnerResponse> Items, int Total, int Page, int PageSize);

public record CreatePartnerRequest(
    string Name, string Email, string Mobile,
    string BusinessName, string ContactPerson, string ContactPhone, string ContactEmail,
    string? GstNumber, string? PanNumber, string? Notes,
    List<Guid> VenueIds);

public record CreatePartnerResponse(
    AdminPartnerResponse Partner, string TempPassword);

public record UpdatePartnerRequest(
    string BusinessName, string ContactPerson, string ContactPhone, string ContactEmail,
    string? GstNumber, string? PanNumber, string? Notes);

public record GrantVenueAccessRequest(Guid VenueId);
