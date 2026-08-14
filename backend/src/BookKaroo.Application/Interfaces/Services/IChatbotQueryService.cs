using BookKaroo.Application.DTOs.Chatbot;

namespace BookKaroo.Application.Interfaces.Services;

public interface IChatbotQueryService
{
    Task<List<ChatbotShowCard>>    SearchShowsAsync(GroqIntentResponse intent, Guid? cityId, CancellationToken ct);
    Task<List<ChatbotEventCard>>   SearchEventsAsync(GroqIntentResponse intent, Guid? cityId, CancellationToken ct);
    Task<List<ChatbotBookingCard>> GetUserBookingsAsync(Guid userId, CancellationToken ct);
}
