namespace BookKaroo.Application.DTOs.Movies;

public record ShowtimesResponse(ShowtimeVenueResponse[] Venues);

public record ShowtimeVenueResponse(
    Guid VenueId,
    string VenueName,
    string? Area,
    string? Distance,
    string[] Amenities,
    decimal FromPrice,
    ShowtimeSlotResponse[] Shows
);

public record ShowtimeSlotResponse(
    Guid Id,
    string ShowTime,
    string Format,
    string Language,
    int SeatsLeft,
    decimal Price
);
