namespace BookKaroo.Application.DTOs.Chatbot;

public class ChatbotMessageResponse
{
    public string                   Message    { get; set; } = string.Empty;
    public string                   Intent     { get; set; } = string.Empty;
    public List<ChatbotShowCard>    Shows      { get; set; } = new();
    public List<ChatbotEventCard>   Events     { get; set; } = new();
    public List<ChatbotBookingCard> Bookings   { get; set; } = new();
    public string                   ActionType { get; set; } = "none"; // "navigate"|"none"
    public string?                  ActionUrl  { get; set; }
}
