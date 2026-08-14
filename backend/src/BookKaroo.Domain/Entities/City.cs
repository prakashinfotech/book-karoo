namespace BookKaroo.Domain.Entities;

public class City : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string StateCode { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public bool IsActive { get; set; } = true;
}
