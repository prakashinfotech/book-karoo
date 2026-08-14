using BookKaroo.Application.DTOs.Chatbot;

namespace BookKaroo.Application.Interfaces.ExternalServices;

public interface IGroqService
{
    Task<GroqIntentResponse> GetIntentAsync(
        string               userMessage,
        List<ConversationTurn> history,
        ChatbotContext       context,
        CancellationToken    ct);
}
