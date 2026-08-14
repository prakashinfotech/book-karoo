namespace BookKaroo.Application.DTOs.Chatbot;

public class GroqIntentResponse
{
    public string  Intent     { get; set; } = string.Empty;
    public string? MovieTitle { get; set; }
    public string? MovieSlug  { get; set; }
    public string? EventType  { get; set; }
    public string? Date       { get; set; }       // "today"|"tomorrow"|"YYYY-MM-DD"
    public string? TimeOfDay  { get; set; }        // "morning"|"afternoon"|"evening"|"night"
    public string? Genre      { get; set; }
    public string? Language   { get; set; }
    public string? Format     { get; set; }        // "IMAX"|"3D"|"2D"
    public string  Answer     { get; set; } = string.Empty;
    public string? ActionType { get; set; }
    public string? ActionUrl  { get; set; }
}
