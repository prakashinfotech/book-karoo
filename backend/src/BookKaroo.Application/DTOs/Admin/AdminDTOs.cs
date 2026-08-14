namespace BookKaroo.Application.DTOs.Admin;

public record TopMovieDto(
    Guid   Id,
    string Title,
    string Slug,
    string? PosterUrl,
    int    BookingCount);

public record DayCount(
    string Date,
    int    Count);

public record CityRevenue(
    string  CityName,
    decimal Revenue);

public record RecentBookingDto(
    string   BookingRef,
    string   Status,
    decimal  AmountPaid,
    DateTime CreatedAt,
    string   UserName,
    string   UserEmail,
    string?  MovieTitle,
    string?  PosterUrl,
    string?  ShowDate,
    string?  ShowTime,
    string   VenueName);

public record ActivityDto(
    string   Action,
    string   EntityType,
    Guid?    EntityId,
    DateTime CreatedAt,
    string?  Ip);

public record DashboardResponse(
    int                      TodayBookings,
    decimal                  TodayRevenue,
    decimal                  WeekRevenue,
    decimal                  MonthRevenue,
    int                      TotalUsers,
    int                      NewUsersToday,
    TopMovieDto?             TopMovie,
    IReadOnlyList<DayCount>  BookingsPerDay,
    IReadOnlyList<CityRevenue> RevenuePerCity,
    IReadOnlyList<RecentBookingDto> RecentBookings,
    IReadOnlyList<ActivityDto> RecentActivity);

public record AuditLogResponse(
    Guid     Id,
    Guid?    UserId,
    string   Action,
    string   EntityType,
    Guid?    EntityId,
    string?  Before,
    string?  After,
    string?  Ip,
    DateTime CreatedAt);

public record AuditLogPagedResponse(
    IReadOnlyList<AuditLogResponse> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);

// ── Movies ────────────────────────────────────────────────────────────────────

public record AdminMovieResponse(
    Guid     Id,
    int?     TmdbId,
    string   Title,
    string   Slug,
    string?  Certificate,
    int      DurationMin,
    string[] Languages,
    string[] Formats,
    string[] Genres,
    string?  ReleaseDate,
    string?  PosterUrl,
    string?  BackdropUrl,
    string?  TrailerUrl,
    decimal? ImdbRating,
    string   Status,
    string   Category,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record AdminMovieDetailResponse(
    Guid     Id,
    int?     TmdbId,
    string   Title,
    string   Slug,
    string?  Description,
    string?  Certificate,
    int      DurationMin,
    string[] Languages,
    string[] Formats,
    string[] Genres,
    string?  Cast,
    string?  Crew,
    string?  ReleaseDate,
    string?  PosterUrl,
    string?  BackdropUrl,
    string?  TrailerUrl,
    decimal? ImdbRating,
    string   Status,
    string   Category,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record CreateMovieRequest(
    string   Title,
    string?  Description,
    int      DurationMin,
    string?  Certificate,
    string[]? Languages,
    string[]? Formats,
    string[]? Genres,
    string?  ReleaseDate,
    string?  PosterUrl,
    string?  BackdropUrl,
    string?  TrailerUrl,
    decimal? ImdbRating,
    string?  Status,
    string?  Category,
    string?  Cast,
    string?  Crew,
    int?     TmdbId);

public record UpdateMovieRequest(
    string?   Title,
    string?   Description,
    int?      DurationMin,
    string?   Certificate,
    string[]? Languages,
    string[]? Formats,
    string[]? Genres,
    string?   ReleaseDate,
    string?   PosterUrl,
    string?   BackdropUrl,
    string?   TrailerUrl,
    decimal?  ImdbRating,
    string?   Status,
    string?   Category,
    string?   Cast,
    string?   Crew);

public record AdminMoviePagedResponse(
    IReadOnlyList<AdminMovieResponse> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);

public record SyncTmdbRequest(int TmdbId);
public record ImportPopularResult(int Imported, int Skipped);

// ── Events ────────────────────────────────────────────────────────────────────

public record AdminEventResponse(
    Guid     Id,
    string   Title,
    string   Slug,
    string   Type,
    string?  EventDate,
    string   EventDateLabel,
    string?  Language,
    int      AgeRestriction,
    string   VenueName,
    string   Status,
    decimal  LowestPrice,
    DateTime CreatedAt);

public record AdminEventDetailResponse(
    Guid     Id,
    string   Title,
    string   Slug,
    string   Type,
    string?  Description,
    Guid?    VenueId,
    string   VenueName,
    string?  EventDate,
    int      DurationMin,
    string?  Language,
    int      AgeRestriction,
    string?  Organizer,
    string?  Artists,
    string?  PriceTiers,
    string?  PosterUrl,
    string?  BackdropUrl,
    string   Status,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record CreateEventRequest(
    string   Title,
    string   Type,
    string?  Description,
    Guid?    VenueId,
    string?  EventDate,
    int      DurationMin,
    string?  Language,
    int      AgeRestriction,
    string?  Organizer,
    string?  Artists,
    string?  PosterUrl,
    string?  BackdropUrl,
    string?  PriceTiers,
    string?  Status);

public record UpdateEventRequest(
    string?  Title,
    string?  Type,
    string?  Description,
    Guid?    VenueId,
    string?  EventDate,
    int?     DurationMin,
    string?  Language,
    int?     AgeRestriction,
    string?  Organizer,
    string?  Artists,
    string?  PosterUrl,
    string?  BackdropUrl,
    string?  PriceTiers,
    string?  Status);

public record AdminEventPagedResponse(
    IReadOnlyList<AdminEventResponse> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);

// ── Venues (for event form dropdown) ─────────────────────────────────────────

public record AdminVenueItem(Guid Id, string Name, string CityName);

// ── Admin Bookings ────────────────────────────────────────────────────────────

public record AdminBookingDto(
    Guid      Id,
    string    BookingRef,
    string    Status,
    decimal   AmountPaid,
    decimal   Discount,
    int       TicketQty,
    decimal   ConvenienceFee,
    decimal   Cgst,
    decimal   Sgst,
    decimal   Igst,
    decimal   OfferProcessingFee,
    DateTime  CreatedAt,
    DateTime? CancelledAt,
    string?   InvoiceUrl,
    string?   QrUrl,
    string?   InvoiceNumber,
    Guid      UserId,
    string    UserName,
    string    UserEmail,
    string    UserMobile,
    string?   MovieTitle,
    string?   PosterUrl,
    string?   EventTitle,
    DateOnly  ShowDate,
    string    ShowDateLabel,
    string    ShowTimeLabel,
    string?   Format,
    string?   Language,
    string    VenueName,
    string    ScreenName,
    string    CityName,
    string?   PaymentMethod,
    string?   ProviderPaymentId,
    string    PaymentStatus,
    decimal?  RefundAmount,
    string?   RefundId,
    string    SeatsSummary);

public record AdminBookingPagedResponse(
    IReadOnlyList<AdminBookingDto> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);

public record AdminCancelBookingResponse(
    string  BookingRef,
    string  Status,
    string  Message,
    decimal RefundAmount);

public record AdminRefundRequest(decimal RefundAmount);

public record AdminRefundResponse(
    string  BookingRef,
    string  RefundId,
    decimal RefundAmount,
    string  Message);

// ── Admin Users ───────────────────────────────────────────────────────────────

public record AdminUserDto(
    Guid      Id,
    string    Name,
    string    Email,
    string    Mobile,
    string?   Gender,
    DateOnly? Dob,
    string?   CityName,
    string?   StateCode,
    string    Role,
    bool      IsBlocked,
    bool      EmailVerified,
    int       TotalBookings,
    decimal   TotalSpent,
    DateTime  CreatedAt,
    string?   ProfilePicUrl,
    string?   Preferences);

public record AdminUserBookingSummaryDto(
    string    BookingRef,
    string    Status,
    decimal   AmountPaid,
    DateTime  CreatedAt,
    int       TicketQty,
    string?   MovieTitle,
    string?   EventTitle,
    DateOnly  ShowDate,
    TimeOnly  ShowTime,
    string    VenueName);

public record AdminUserDetailDto(
    Guid      Id,
    string    Name,
    string    Email,
    string    Mobile,
    string?   Gender,
    DateOnly? Dob,
    string?   CityName,
    string?   StateCode,
    string    Role,
    bool      IsBlocked,
    bool      EmailVerified,
    int       TotalBookings,
    decimal   TotalSpent,
    DateTime  CreatedAt,
    string?   ProfilePicUrl,
    string?   Preferences,
    List<AdminUserBookingSummaryDto> RecentBookings);

public record AdminUserPagedResponse(
    IReadOnlyList<AdminUserDto> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);

public record AdminResetPasswordResponse(string TempPassword);

// ── Admin Venues CRUD ─────────────────────────────────────────────────────────

public record VenueAdminDto(
    Guid     Id,
    string   Name,
    string   Slug,
    string?  Chain,
    string   Address,
    Guid     CityId,
    string   CityName,
    string   CityState,
    string?  StateCode,
    double   Latitude,
    double   Longitude,
    string[] Amenities,
    bool     IsActive,
    string?  ContactPhone,
    string?  ContactEmail,
    int      ScreenCount,
    DateTime CreatedAt);

public record ScreenDetailDto(
    Guid   Id,
    string Name,
    int    TotalSeats,
    bool   IsActive,
    object? Layout);

public record VenueWithScreensDto(
    Guid              Id,
    string            Name,
    string            Slug,
    string?           Chain,
    string            Address,
    Guid              CityId,
    string            CityName,
    string            CityState,
    string?           StateCode,
    double            Latitude,
    double            Longitude,
    string[]          Amenities,
    bool              IsActive,
    string?           ContactPhone,
    string?           ContactEmail,
    int               ScreenCount,
    DateTime          CreatedAt,
    List<ScreenDetailDto> Screens);

public record AdminVenuePagedResponse(
    IReadOnlyList<VenueAdminDto> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);

public record CreateVenueRequest(
    string   Name,
    string?  Chain,
    string   Address,
    Guid     CityId,
    double?  Latitude,
    double?  Longitude,
    string?  ContactPhone,
    string?  ContactEmail,
    string[] Amenities,
    bool     IsActive);

public record UpdateVenueRequest(
    string?   Name,
    string?   Chain,
    string?   Address,
    Guid?     CityId,
    double?   Latitude,
    double?   Longitude,
    string?   ContactPhone,
    string?   ContactEmail,
    string[]? Amenities,
    bool?     IsActive);

public record CreateScreenRequest(
    string  Name,
    string  LayoutJson,
    bool    IsActive = true);

public record UpdateScreenRequest(
    string? Name,
    string? LayoutJson,
    bool?   IsActive);

// ── Admin Shows CRUD ──────────────────────────────────────────────────────────

public record ShowAdminDto(
    Guid     ShowId,
    string?  MovieTitle,
    string?  MoviePosterUrl,
    string?  EventTitle,
    Guid     VenueId,
    string   VenueName,
    string   ScreenName,
    string   CityName,
    DateOnly ShowDate,
    string   ShowDateLabel,
    string   ShowTimeLabel,
    DateTime ShowDatetime,
    string?  Format,
    string?  Language,
    string   Status,
    int      TotalSeats,
    int      BookedSeats,
    int      AvailableSeats,
    decimal  OccupancyPercent,
    decimal  RevenueGenerated);

public record AdminShowPagedResponse(
    IReadOnlyList<ShowAdminDto> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);

public record CreateShowRequest(
    Guid      ScreenId,
    Guid?     MovieId,
    Guid?     EventId,
    DateOnly  ShowDate,
    TimeOnly  ShowTime,
    string    Format,
    string    Language,
    string?   PriceOverrides);

public record CancelShowResponse(
    Guid   ShowId,
    int    CancelledBookings,
    string Message);

// ── Admin Reports ─────────────────────────────────────────────────────────────

public record ReportRow(
    string   Period,
    Guid?    EntityId,
    string?  PosterUrl,
    int      TotalBookings,
    int      ConfirmedBookings,
    int      CancelledBookings,
    decimal  Revenue,
    decimal  ConvenienceFeeRevenue,
    decimal  GstCollected,
    decimal  Discount);

public record ReportSummary(
    int     TotalBookings,
    int     ConfirmedBookings,
    int     CancelledBookings,
    decimal TotalRevenue,
    decimal ConvenienceFeeRevenue,
    decimal GstCollected,
    decimal TotalDiscount,
    decimal NetRevenue);

public record BookingReportResponse(
    string         FromDate,
    string         ToDate,
    string         GroupBy,
    ReportSummary  Summary,
    List<ReportRow> Rows);

public record UserReportRow(
    string Period,
    int    NewUsers,
    int    VerifiedUsers);

public record UserReportResponse(
    string             FromDate,
    string             ToDate,
    int                TotalNewUsers,
    int                VerifiedUsers,
    List<UserReportRow> Rows);

// ── Admin Banners ─────────────────────────────────────────────────────────────

public record AdminBannerResponse(
    Guid      Id,
    string    Title,
    string?   ImageUrl,
    string?   LinkUrl,
    int       Position,
    bool      IsActive,
    DateTime? StartsAt,
    DateTime? EndsAt,
    DateTime  CreatedAt,
    DateTime  UpdatedAt);

public record CreateBannerRequest(
    string    Title,
    string    ImageUrl,
    string?   LinkUrl,
    int       Position,
    bool      IsActive,
    DateTime? StartsAt,
    DateTime? EndsAt);

public record UpdateBannerRequest(
    string?   Title,
    string?   ImageUrl,
    string?   LinkUrl,
    int?      Position,
    bool?     IsActive,
    DateTime? StartsAt,
    DateTime? EndsAt);

public record ReorderBannersRequest(List<Guid> OrderedIds);

public record ToggleBannerRequest(bool IsActive);

// ── Admin Settings ────────────────────────────────────────────────────────────

public record SettingResponse(string Key, string Value, DateTime UpdatedAt);

public record UpdateSettingValueRequest(string Value);

public record BatchUpdateSettingsRequest(Dictionary<string, string> Settings);
