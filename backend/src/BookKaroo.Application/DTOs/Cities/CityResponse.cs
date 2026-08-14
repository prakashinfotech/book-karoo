namespace BookKaroo.Application.DTOs.Cities;

public record CityResponse(
    Guid Id,
    string Name,
    string Slug,
    string State,
    string StateCode,
    double Latitude,
    double Longitude
);
