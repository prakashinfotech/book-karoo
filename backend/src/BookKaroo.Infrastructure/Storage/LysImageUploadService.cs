using BookKaroo.Application.DTOs.Lys;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Infrastructure.Storage;

public class LysImageUploadService : ILysImageUploadService
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration     _config;
    private readonly BookKarooDbContext  _db;
    private readonly ILogger<LysImageUploadService> _logger;

    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB
    private static readonly HashSet<string> AllowedTypes = ["image/jpeg", "image/png", "image/webp"];
    private const string Bucket = "lys-images";

    public LysImageUploadService(
        IHttpClientFactory http,
        IConfiguration     config,
        BookKarooDbContext  db,
        ILogger<LysImageUploadService> logger)
    {
        _http   = http;
        _config = config;
        _db     = db;
        _logger = logger;
    }

    public Task<LysUploadResult> UploadPosterAsync(
        Guid organizerId, Stream imageStream, string fileName, string mimeType, CancellationToken ct = default) =>
        UploadAsync(organizerId, null, imageStream, fileName, mimeType, "posters", ct);

    public Task<LysUploadResult> UploadBackdropAsync(
        Guid organizerId, Stream imageStream, string fileName, string mimeType, CancellationToken ct = default) =>
        UploadAsync(organizerId, null, imageStream, fileName, mimeType, "backdrops", ct);

    private async Task<LysUploadResult> UploadAsync(
        Guid organizerId, Guid? eventId,
        Stream imageStream, string fileName, string mimeType, string folder,
        CancellationToken ct)
    {
        if (!AllowedTypes.Contains(mimeType))
            throw new AppException("Only JPEG, PNG, or WebP images are allowed.");

        using var ms = new MemoryStream();
        await imageStream.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();

        if (bytes.Length > MaxBytes)
            throw new AppException("Image must be 5 MB or smaller.");

        var ext = mimeType switch
        {
            "image/jpeg" => ".jpg",
            "image/png"  => ".png",
            "image/webp" => ".webp",
            _            => ".jpg",
        };

        var path      = $"{folder}/{organizerId}/{Guid.NewGuid()}{ext}";
        var publicUrl = await UploadToSupabaseAsync(path, bytes, mimeType, ct)
            ?? throw new AppException("Image upload failed. Please try again.");

        var upload = new LysUpload
        {
            OrganizerId = organizerId,
            LysEventId  = eventId,
            FileName    = fileName,
            StoragePath = path,
            PublicUrl   = publicUrl,
            FileSize    = bytes.Length,
            MimeType    = mimeType,
        };
        await _db.LysUploads.AddAsync(upload, ct);
        await _db.SaveChangesAsync(ct);

        return new LysUploadResult
        {
            PublicUrl     = publicUrl,
            StoragePath   = path,
            FileSizeBytes = bytes.Length,
        };
    }

    private async Task<string?> UploadToSupabaseAsync(
        string path, byte[] data, string contentType, CancellationToken ct)
    {
        var url = _config["SUPABASE_URL"];
        var key = _config["SUPABASE_SERVICE_ROLE_KEY"];
        if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key)) return null;

        try
        {
            var client = _http.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {key}");
            client.DefaultRequestHeaders.Add("apikey", key);

            var content = new ByteArrayContent(data);
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

            var response = await client.PostAsync($"{url}/storage/v1/object/{Bucket}/{path}", content, ct);
            if (response.IsSuccessStatusCode)
                return $"{url}/storage/v1/object/public/{Bucket}/{path}";

            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Supabase LYS upload failed {Status}: {Error}", response.StatusCode, err);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload LYS image to Supabase {Path}", path);
            return null;
        }
    }
}
