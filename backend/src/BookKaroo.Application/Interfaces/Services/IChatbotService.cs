using BookKaroo.Application.DTOs.Chatbot;

namespace BookKaroo.Application.Interfaces.Services;

public interface IChatbotService
{
    Task<ChatbotMessageResponse> ProcessMessageAsync(
        ChatbotMessageRequest request,
        Guid?                 userId,
        Guid?                 cityId,
        string                cityName,
        string?               userName,
        CancellationToken     ct);
}
