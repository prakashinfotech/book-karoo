using BookKaroo.Application.DTOs.Events;
using BookKaroo.Application.DTOs.Movies;

namespace BookKaroo.Application.DTOs.Home;

public record BannerResponse(
    Guid    Id,
    string  Title,
    string? ImageUrl,
    string? LinkUrl,
    int     Position);

public record HomeResponse(
    IReadOnlyList<MovieListResponse>  NowShowing,
    IReadOnlyList<MovieListResponse>  ComingSoon,
    IReadOnlyList<EventListResponse>  LiveEvents,
    IReadOnlyList<EventListResponse>  Plays,
    IReadOnlyList<EventListResponse>  Comedy,
    IReadOnlyList<EventListResponse>  IplMatches,
    IReadOnlyList<BannerResponse>     Banners);
