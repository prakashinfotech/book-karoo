using BookKaroo.Application.DTOs.Lys;

namespace BookKaroo.Application.Interfaces.Services;

public interface ILysEventService
{
    Task<LysEventResponse> CreateDraftAsync(Guid organizerId, CreateLysEventRequest req, CancellationToken ct = default);
    Task<LysEventResponse> UpdateDraftAsync(Guid organizerId, Guid eventId, UpdateLysEventRequest req, CancellationToken ct = default);
    Task<LysEventResponse> SubmitForReviewAsync(Guid organizerId, Guid eventId, CancellationToken ct = default);
    Task DeleteDraftAsync(Guid organizerId, Guid eventId, CancellationToken ct = default);
    Task<LysEventResponse> GetByIdAsync(Guid organizerId, Guid eventId, CancellationToken ct = default);
    Task<(List<LysEventListItem> Items, int Total)> GetMyEventsAsync(Guid organizerId, string? status, int page, int pageSize, CancellationToken ct = default);
    Task<List<LysDuplicateWarning>> CheckDuplicatesAsync(Guid organizerId, string title, DateTime date, CancellationToken ct = default);
    Task<LysUploadResult> UploadImageAsync(Guid organizerId, Guid? eventId, Stream stream, string fileName, string mimeType, string imageType, CancellationToken ct = default);
}
