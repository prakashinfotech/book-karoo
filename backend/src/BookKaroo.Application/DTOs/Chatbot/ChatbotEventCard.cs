namespace BookKaroo.Application.DTOs.Chatbot;

public class ChatbotEventCard
{
    public Guid    EventId        { get; set; }
    public string  Title          { get; set; } = string.Empty;
    public string  Slug           { get; set; } = string.Empty;
    public string  PosterUrl      { get; set; } = string.Empty;
    public string  Type           { get; set; } = string.Empty;
    public string  EventDateLabel { get; set; } = string.Empty;
    public string  EventTimeLabel { get; set; } = string.Empty;
    public string  VenueName      { get; set; } = string.Empty;
    public string  CityName       { get; set; } = string.Empty;
    public decimal LowestPrice    { get; set; }
}
