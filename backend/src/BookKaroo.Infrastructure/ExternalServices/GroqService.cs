using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BookKaroo.Application.DTOs.Chatbot;
using BookKaroo.Application.Interfaces.ExternalServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Infrastructure.ExternalServices;

public class GroqService : IGroqService
{
    private readonly HttpClient           _http;
    private readonly string               _model;
    private readonly string               _apiKey;
    private readonly ILogger<GroqService> _log;

    public GroqService(IHttpClientFactory factory, IConfiguration config, ILogger<GroqService> log)
    {
        _http   = factory.CreateClient("groq");
        _model  = config["GROQ_MODEL"]   ?? "llama-3.3-70b-versatile";
        _apiKey = config["GROQ_API_KEY"] ?? string.Empty;
        _log    = log;
    }

    public async Task<GroqIntentResponse> GetIntentAsync(
        string                 userMessage,
        List<ConversationTurn> history,
        ChatbotContext         context,
        CancellationToken      ct)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _log.LogWarning("GROQ_API_KEY is not configured — chatbot returning fallback");
            return Fallback();
        }

        try
        {
            var systemPrompt = BuildSystemPrompt(context);

            var messages = new List<object>
            {
                new { role = "system", content = systemPrompt }
            };
            foreach (var h in history.TakeLast(5))
                messages.Add(new { role = h.Role, content = h.Content });
            messages.Add(new { role = "user", content = userMessage });

            var body = new
            {
                model           = _model,
                temperature     = 0.15,
                max_tokens      = 500,
                response_format = new { type = "json_object" },
                messages
            };

            var json    = JsonSerializer.Serialize(body);
            using var req = new HttpRequestMessage(HttpMethod.Post, "openai/v1/chat/completions");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(req, ct);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                _log.LogWarning("Groq API error {Status}: {Body}", response.StatusCode, err);
                return Fallback();
            }

            var raw = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(raw);
            var messageContent = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "{}";

            var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<GroqIntentResponse>(messageContent, opts) ?? Fallback();
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Groq service failed — returning fallback response");
            return Fallback();
        }
    }

    private static GroqIntentResponse Fallback() => new()
    {
        Intent = "GENERAL",
        Answer = "I'm having trouble right now. Please try again in a moment. 🙏"
    };

    private static string BuildSystemPrompt(ChatbotContext ctx) => $$"""
        You are BookKaroo Assistant, a helpful AI for India's entertainment booking platform.
        You help users find movies, events, check showtimes, and navigate the site.

        TODAY: {{ctx.TodayDayName}}, {{ctx.TodayDate}}
        USER CITY: {{ctx.CityName}}
        USER STATUS: {{(ctx.IsAuthenticated ? $"Logged in as {ctx.UserName}" : "Guest")}}

        YOUR JOB:
        Understand the user's request and extract structured intent.
        Respond ONLY with valid JSON matching this exact schema:

        {
          "intent": "SHOW_SEARCH | MOVIE_INFO | EVENT_SEARCH | MY_BOOKINGS | RECOMMENDATION | AVAILABILITY | GENERAL",
          "movieTitle": "extracted movie title or null",
          "movieSlug": "url-safe slug e.g. kgf-chapter-2 or null",
          "eventType": "ipl | live_event | play | sport | comedy | activity or null",
          "date": "today | tomorrow | weekend | YYYY-MM-DD or null",
          "timeOfDay": "morning | afternoon | evening | night or null",
          "genre": "Action | Comedy | Horror | Drama | Romance | Thriller | Family or null",
          "language": "Hindi | English | Tamil | Telugu | Kannada | Malayalam or null",
          "format": "IMAX | 3D | 2D or null",
          "answer": "Your friendly natural language response. 1-3 sentences. Use emojis. Be concise.",
          "actionType": "navigate | none",
          "actionUrl": "/path or null"
        }

        INTENT RULES + ANSWER GUIDANCE:

        SHOW_SEARCH — user wants to find/book movie shows
          answer: "Sure! Here are the upcoming shows for [movie] in [city] 🎬" or "Looking up shows near you!" (short, 1 sentence)
          date rules: "this weekend" / "weekend shows" → "weekend"; "today" → "today"; "tomorrow" → "tomorrow"; specific date → YYYY-MM-DD; no date mentioned → null

        MOVIE_INFO — user asks about a movie (plot, cast, rating, genre, certificate)
          answer: Give a 2-3 sentence factual summary of the movie. Include genre, lead cast, director if known, and certificate (U/A, A, U). End with an emoji. DO NOT say "I'll look that up" — actually answer it.

        EVENT_SEARCH — user wants concerts, IPL, plays, sports, comedy
          answer: "Here are upcoming [eventType] events in [city]! 🎭" (1 sentence)

        MY_BOOKINGS — user wants to see their bookings
          If guest: answer = "Please sign in to view your bookings. 🔐"
          If authenticated: answer = "Here are your upcoming bookings, [userName]! 🎟️"

        RECOMMENDATION — user wants movie suggestions
          answer: Recommend 2-3 specific movies with brief reasons. Include genre. E.g. "For action try Kalki 2898-AD ⚡ — stunning visuals. For comedy, try Munjya 😄 — hilarious family horror-comedy." Be specific and opinionated.

        AVAILABILITY — user asks about seat availability
          answer: "Let me check seat availability for you! 🎟️" (1 sentence)

        GENERAL — greetings, site navigation, how to book, FAQs
          answer: Give a genuinely helpful answer. For greetings say hello warmly. For site questions explain the booking process clearly. For unknown queries say you can help find movies and events.

        ACTION TYPE RULES — CRITICAL:
        - actionType MUST be "none" for: SHOW_SEARCH, EVENT_SEARCH, MY_BOOKINGS, AVAILABILITY, RECOMMENDATION, MOVIE_INFO
          (the backend fetches and displays data cards automatically — do NOT add a navigation link for these)
        - actionType MAY be "navigate" ONLY for GENERAL intent when directing user to a page (e.g. "go to movies page")
        - When actionType is "none", actionUrl MUST be null

        TIME OF DAY: morning=6-12, afternoon=12-17, evening=17-21, night=21-24

        SLUG RULES: lowercase, spaces→hyphens, remove special chars.
        "KGF: Chapter 2" → "kgf-chapter-2", "Pushpa 2: The Rule" → "pushpa-2-the-rule"

        NAVIGATION URLS (only for GENERAL intent):
        /movies | /movies/{slug} | /movies/{slug}/showtimes | /events | /ipl | /sports | /plays | /profile/bookings | /search?q={query}

        PERSONALITY: Friendly, warm, knowledgeable about Indian cinema and entertainment. Use emojis 🎬🎟🏏🎭⭐. Never mention SQL, databases, or internal systems.
        """;
}
