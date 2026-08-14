namespace BookKaroo.Application.DTOs.Chatbot;

public class ChatbotShowCard
{
    public Guid    ShowId         { get; set; }
    public string  MovieTitle     { get; set; } = string.Empty;
    public string  MovieSlug      { get; set; } = string.Empty;
    public string  PosterUrl      { get; set; } = string.Empty;
    public string  Certificate    { get; set; } = string.Empty;
    public string  Format         { get; set; } = string.Empty;
    public string  Language       { get; set; } = string.Empty;
    public string  ShowDate       { get; set; } = string.Empty;
    public string  ShowTime       { get; set; } = string.Empty;
    public string  VenueName      { get; set; } = string.Empty;
    public string  ScreenName     { get; set; } = string.Empty;
    public string  CityName       { get; set; } = string.Empty;
    public decimal LowestPrice    { get; set; }
    public int     AvailableSeats { get; set; }
    public string  Availability   { get; set; } = string.Empty; // "green"|"orange"|"red"|"sold_out"
}
