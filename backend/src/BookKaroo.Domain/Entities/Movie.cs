using BookKaroo.Domain.Enums;

namespace BookKaroo.Domain.Entities;

public class Movie : BaseEntity
{
    public int? TmdbId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMin { get; set; }
    public string[] Languages { get; set; } = [];
    public string[] Formats { get; set; } = [];
    public string[] Genres { get; set; } = [];
    public string? Cast { get; set; }
    public string? Crew { get; set; }
    public string? Certificate { get; set; }
    public DateOnly? ReleaseDate { get; set; }
    public string? PosterUrl { get; set; }
    public string? BackdropUrl { get; set; }
    public string? TrailerUrl { get; set; }
    public decimal? ImdbRating { get; set; }
    public MovieStatus Status { get; set; } = MovieStatus.Draft;
    public MovieCategory Category { get; set; } = MovieCategory.NowShowing;
}
