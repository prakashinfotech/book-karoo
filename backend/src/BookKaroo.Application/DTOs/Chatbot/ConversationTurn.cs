namespace BookKaroo.Application.DTOs.Chatbot;

public class ConversationTurn
{
    public string Role    { get; set; } = string.Empty; // "user" | "assistant"
    public string Content { get; set; } = string.Empty;
}
