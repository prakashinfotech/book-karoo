namespace BookKaroo.Application.DTOs.Shows;

public record ShowtimeItem(
    Guid   ShowId,
    string Time,
    string Format,
    string Language,
    string Availability,
    decimal LowestPrice
);

public record ShowtimeVenueGroup(
    Guid          VenueId,
    string        VenueName,
    string        VenueArea,
    string?       Distance,
    string[]      Amenities,
    ShowtimeItem[] Shows
);

public record ShowtimesGroupedResponse(ShowtimeVenueGroup[] Venues);

public record SeatAvailability(string[] BookedSeats, string[] LockedSeats);

public record ShowMetadata(
    string  MovieTitle,
    string? PosterUrl,
    string  Format,
    string  Language,
    string  ShowDate,
    string  ShowTime,
    string  VenueName,
    string  ScreenName);

public record ShowSeatsResponse(
    Guid          ShowId,
    object?       ScreenLayout,
    string[]      BookedSeats,
    string[]      LockedSeats,
    ShowMetadata? Show);
