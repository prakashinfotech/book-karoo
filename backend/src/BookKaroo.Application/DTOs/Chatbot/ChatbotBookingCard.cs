namespace BookKaroo.Application.DTOs.Chatbot;

public class ChatbotBookingCard
{
    public string  BookingRef  { get; set; } = string.Empty;
    public string  Title       { get; set; } = string.Empty;
    public string  PosterUrl   { get; set; } = string.Empty;
    public string  ShowDate    { get; set; } = string.Empty;
    public string  ShowTime    { get; set; } = string.Empty;
    public string  VenueName   { get; set; } = string.Empty;
    public string  Status      { get; set; } = string.Empty;
    public int     TicketQty   { get; set; }
    public decimal AmountPaid  { get; set; }
}
