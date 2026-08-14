namespace BookKaroo.Domain.Entities;

public class RemindMe : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? MovieId { get; set; }
    public Guid? EventId { get; set; }
    public bool Notified { get; set; }
}
