using BookKaroo.Application.DTOs.Chatbot;
using BookKaroo.Application.Interfaces.ExternalServices;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Application.Services;

public class ChatbotService : IChatbotService
{
    private readonly IGroqService          _groq;
    private readonly IChatbotQueryService  _query;
    private readonly ILogger<ChatbotService> _log;

    public ChatbotService(
        IGroqService groq,
        IChatbotQueryService query,
        ILogger<ChatbotService> log)
    {
        _groq  = groq;
        _query = query;
        _log   = log;
    }

    public async Task<ChatbotMessageResponse> ProcessMessageAsync(
        ChatbotMessageRequest request,
        Guid?                 userId,
        Guid?                 cityId,
        string                cityName,
        string?               userName,
        CancellationToken     ct)
    {
        var context = new ChatbotContext
        {
            CityName        = cityName,
            CityId          = cityId,
            IsAuthenticated = userId.HasValue,
            UserName        = userName,
            TodayDate       = DateOnly.FromDateTime(DateTime.Today).ToString("dd MMM yyyy"),
            TodayDayName    = DateTime.Today.DayOfWeek.ToString(),
        };

        GroqIntentResponse intent;
        try
        {
            intent = await _groq.GetIntentAsync(request.Message, request.History, context, ct);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Groq call failed; returning generic fallback");
            intent = new GroqIntentResponse
            {
                Intent = "GENERAL",
                Answer = "I'm having trouble right now. Please try again in a moment. 🙏"
            };
        }

        var response = new ChatbotMessageResponse
        {
            Message = intent.Answer ?? string.Empty,
            Intent  = intent.Intent ?? "GENERAL",
        };

        var upperIntent = intent.Intent?.ToUpperInvariant();

        switch (upperIntent)
        {
            case "SHOW_SEARCH":
            case "AVAILABILITY":
            {
                response.Shows = await _query.SearchShowsAsync(intent, cityId, ct);
                if (response.Shows.Count == 0)
                {
                    var movieHint = !string.IsNullOrWhiteSpace(intent.MovieTitle)
                        ? $" for \"{intent.MovieTitle}\""
                        : "";
                    var cityHint = cityName != "your city"
                        ? $" in {cityName}"
                        : "";
                    var periodHint = intent.Date?.ToLowerInvariant() switch
                    {
                        "today"    => "today",
                        "tomorrow" => "tomorrow",
                        "weekend"  => "this weekend",
                        _          => "in the next 7 days"
                    };
                    response.Message =
                        $"😔 No shows found{movieHint}{cityHint} {periodHint}. " +
                        "The movie may not be scheduled yet — try a different date or browse all movies.";
                }
                break;
            }

            case "EVENT_SEARCH":
            {
                response.Events = await _query.SearchEventsAsync(intent, cityId, ct);
                if (response.Events.Count == 0)
                    response.Message =
                        "😔 No upcoming events found right now. Check back soon or browse the events page!";
                break;
            }

            case "MY_BOOKINGS":
            {
                if (userId.HasValue)
                {
                    response.Bookings = await _query.GetUserBookingsAsync(userId.Value, ct);
                    if (response.Bookings.Count == 0)
                        response.Message =
                            "You have no upcoming confirmed bookings. 🎟️ Browse movies or events to book your next show!";
                }
                break;
            }
        }

        // Backend owns navigation — Groq's actionType is ignored for data-returning intents
        // to prevent spurious "Go there" links appearing instead of actual cards.
        (response.ActionType, response.ActionUrl) = upperIntent switch
        {
            "MY_BOOKINGS"                    => ("navigate", "/profile/bookings"),
            "SHOW_SEARCH" or "AVAILABILITY"  => ("none",     null),
            "EVENT_SEARCH"                   => ("none",     null),
            "RECOMMENDATION" or "MOVIE_INFO" => ("none",     null),
            _                                => (intent.ActionType ?? "none", intent.ActionUrl)
        };

        return response;
    }
}
