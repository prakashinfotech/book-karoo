using BookKaroo.Application.DTOs.Lys;

namespace BookKaroo.Application.Interfaces.Services;

public interface ILysPartnerService
{
    Task<(List<LysPartnerEventDto> Items, int Total)> GetSubmissionsAsync(
        Guid partnerId, List<Guid> venueIds, string? status,
        int page, int pageSize, CancellationToken ct = default);

    Task<LysPartnerEventDto> GetSubmissionDetailAsync(
        Guid partnerId, List<Guid> venueIds, Guid eventId, CancellationToken ct = default);

    Task<LysPartnerEventDto> ApproveAsync(
        Guid partnerId, List<Guid> venueIds, Guid eventId, CancellationToken ct = default);

    Task<LysPartnerEventDto> RejectAsync(
        Guid partnerId, List<Guid> venueIds, Guid eventId, string reason, CancellationToken ct = default);

    Task<LysPartnerEventDto> RequestChangesAsync(
        Guid partnerId, List<Guid> venueIds, Guid eventId, string notes, CancellationToken ct = default);

    Task<int> GetPendingCountAsync(
        Guid partnerId, List<Guid> venueIds, CancellationToken ct = default);
}
