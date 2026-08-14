using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Infrastructure.Storage;

/// <summary>
/// Supabase Storage wrapper. Uses the REST API directly via HttpClient
/// (avoids Supabase C# client SDK version conflicts).
/// </summary>
public class SupabaseStorageService
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(
        IHttpClientFactory http,
        IConfiguration config,
        ILogger<SupabaseStorageService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<string?> UploadQrAsync(string bookingRef, byte[] pngBytes, CancellationToken ct = default)
    {
        var path = $"{bookingRef}.png";
        return await UploadAsync("qr-codes", path, pngBytes, "image/png", ct);
    }

    public async Task<string?> UploadInvoiceAsync(Guid userId, string bookingRef, byte[] pdfBytes, CancellationToken ct = default)
    {
        var path = $"{userId}/{bookingRef}_GST_Invoice.pdf";
        return await UploadAsync("invoices", path, pdfBytes, "application/pdf", ct);
    }

    public async Task<string?> GetSignedUrlAsync(string bucket, string path, int expiresInSeconds = 3600, CancellationToken ct = default)
    {
        var url = _config["SUPABASE_URL"];
        var key = _config["SUPABASE_SERVICE_ROLE_KEY"];
        if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key)) return null;

        try
        {
            var client = _http.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {key}");
            client.DefaultRequestHeaders.Add("apikey", key);

            var body = System.Text.Json.JsonSerializer.Serialize(new { expiresIn = expiresInSeconds });
            var content = new System.Net.Http.StringContent(body, System.Text.Encoding.UTF8, "application/json");
            var response = await client.PostAsync($"{url}/storage/v1/object/sign/{bucket}/{path}", content, ct);

            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadAsStringAsync(ct);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("signedURL", out var signedUrl))
                return $"{url}{signedUrl.GetString()}";
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get signed URL for {Bucket}/{Path}", bucket, path);
            return null;
        }
    }

    private async Task<string?> UploadAsync(string bucket, string path, byte[] data, string contentType, CancellationToken ct)
    {
        var url = _config["SUPABASE_URL"];
        var key = _config["SUPABASE_SERVICE_ROLE_KEY"];
        if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key)) return null;

        try
        {
            var client = _http.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {key}");
            client.DefaultRequestHeaders.Add("apikey", key);

            var content = new System.Net.Http.ByteArrayContent(data);
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

            var response = await client.PostAsync($"{url}/storage/v1/object/{bucket}/{path}", content, ct);
            if (response.IsSuccessStatusCode)
                return $"{url}/storage/v1/object/public/{bucket}/{path}";

            var err = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Supabase upload failed {Status}: {Error}", response.StatusCode, err);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload to Supabase {Bucket}/{Path}", bucket, path);
            return null;
        }
    }
}
