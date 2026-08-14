using BookKaroo.Application.DTOs.Lys;

namespace BookKaroo.Application.Interfaces.Services;

public interface ILysAdminService
{
    Task<(List<LysEventAdminDto> Items, int Total)> GetSubmissionsAsync(
        string? search, string? status, string? type,
        DateOnly? fromDate, DateOnly? toDate,
        int page, int pageSize, CancellationToken ct = default);

    Task<LysEventAdminDto> GetSubmissionDetailAsync(Guid eventId, CancellationToken ct = default);
    Task<LysEventAdminDto> ApproveEventAsync(Guid eventId, Guid adminId, CancellationToken ct = default);
    Task<LysEventAdminDto> RejectEventAsync(Guid eventId, Guid adminId, string reason, CancellationToken ct = default);
    Task<LysEventAdminDto> RequestChangesAsync(Guid eventId, Guid adminId, string notes, CancellationToken ct = default);
    Task<LysEventAdminDto> UnpublishEventAsync(Guid eventId, Guid adminId, string reason, CancellationToken ct = default);

    Task<(List<LysOrganizerAdminDto> Items, int Total)> GetOrganizersAsync(
        string? search, bool? isVerified, int page, int pageSize, CancellationToken ct = default);

    Task VerifyOrganizerAsync(Guid organizerId, Guid adminId, CancellationToken ct = default);
    Task UnverifyOrganizerAsync(Guid organizerId, CancellationToken ct = default);
    Task DeactivateOrganizerAsync(Guid organizerId, CancellationToken ct = default);
}
