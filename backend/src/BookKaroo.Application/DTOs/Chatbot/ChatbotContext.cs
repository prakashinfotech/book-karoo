namespace BookKaroo.Application.DTOs.Chatbot;

public class ChatbotContext
{
    public string  CityName        { get; set; } = string.Empty;
    public Guid?   CityId          { get; set; }
    public bool    IsAuthenticated { get; set; }
    public string? UserName        { get; set; }
    public string  TodayDate       { get; set; } = string.Empty;
    public string  TodayDayName    { get; set; } = string.Empty;
}
