namespace BookKaroo.Application.DTOs.Chatbot;

public class ChatbotMessageRequest
{
    public string                  Message { get; set; } = string.Empty;
    public List<ConversationTurn>  History { get; set; } = new();
}
