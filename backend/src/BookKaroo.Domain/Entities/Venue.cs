namespace BookKaroo.Domain.Entities;

public class Venue : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Chain { get; set; }
    public string Address { get; set; } = string.Empty;
    public Guid CityId { get; set; }
    public string? StateCode { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? Amenities { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
}
