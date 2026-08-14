namespace BookKaroo.Application.DTOs.Search;

public record SearchMovieResult(
    Guid    Id,
    string  Title,
    string  Slug,
    string? PosterUrl,
    string? Certificate,
    string  Category,
    decimal? ImdbRating)
{
    public string Type => "movie";
}

public record SearchEventResult(
    Guid     Id,
    string   Title,
    string   Slug,
    string?  PosterUrl,
    string   EventType,
    string?  EventDate)
{
    public string Type => "event";
}

public record SearchVenueResult(
    Guid    Id,
    string  Name,
    string  Slug,
    string? Chain,
    string  CityName)
{
    public string Type => "venue";
}

public record SearchCityResult(
    Guid   Id,
    string Name,
    string Slug,
    string State,
    string StateCode)
{
    public string Type => "city";
}

public record SearchResponse(
    IReadOnlyList<SearchMovieResult> Movies,
    IReadOnlyList<SearchEventResult> Events,
    IReadOnlyList<SearchVenueResult> Venues,
    IReadOnlyList<SearchCityResult>  Cities,
    string Query,
    int    TotalResults);
