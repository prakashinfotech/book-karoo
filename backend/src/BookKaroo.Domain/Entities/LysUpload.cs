namespace BookKaroo.Domain.Entities;

public class LysUpload
{
    public Guid    Id           { get; set; } = Guid.NewGuid();
    public Guid    OrganizerId  { get; set; }
    public Guid?   LysEventId   { get; set; }
    public string  FileName     { get; set; } = string.Empty;
    public string  StoragePath  { get; set; } = string.Empty;
    public string  PublicUrl    { get; set; } = string.Empty;
    public long?   FileSize     { get; set; }
    public string? MimeType     { get; set; }
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
}
