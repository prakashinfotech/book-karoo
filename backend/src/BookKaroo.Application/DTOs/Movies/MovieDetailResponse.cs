namespace BookKaroo.Application.DTOs.Movies;

public record CastMember(string Name, string Role, string? Photo);
public record CrewMember(string Name, string Role);

public record MovieDetailResponse(
    Guid     Id,
    string   Title,
    string   Slug,
    string?  Description,
    int      DurationMin,
    string[] Languages,
    string[] Formats,
    string[] Genres,
    string?  Certificate,
    string?  ReleaseDate,
    string?  PosterUrl,
    string?  BackdropUrl,
    string?  TrailerUrl,
    decimal? ImdbRating,
    string   Status,
    string   Category,
    // Detail-only fields
    CastMember[]                 Cast,
    CrewMember[]                 Crew,
    decimal                      AverageRating,
    Dictionary<int, int>         RatingDistribution,
    int                          TotalReviews,
    IEnumerable<MovieListResponse> Related,
    bool                         CanReview
);
