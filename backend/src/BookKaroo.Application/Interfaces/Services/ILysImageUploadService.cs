using BookKaroo.Application.DTOs.Lys;

namespace BookKaroo.Application.Interfaces.Services;

public interface ILysImageUploadService
{
    Task<LysUploadResult> UploadPosterAsync(Guid organizerId, Stream imageStream, string fileName, string mimeType, CancellationToken ct = default);
    Task<LysUploadResult> UploadBackdropAsync(Guid organizerId, Stream imageStream, string fileName, string mimeType, CancellationToken ct = default);
}
