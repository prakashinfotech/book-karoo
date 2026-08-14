using System.Security.Claims;
using BookKaroo.Application.Common;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Http;

namespace BookKaroo.Infrastructure.Auth;

/// <summary>
/// Scoped per-request context that resolves the calling user's partner profile
/// and their accessible venues. Throws ForbiddenException if the user has no
/// active partner profile. EnsureVenueAccess() must be called before mutating
/// any data scoped to a venue.
/// </summary>
public class PartnerContext : IPartnerContext
{
    public Guid UserId { get; }
    public Guid PartnerId { get; }
    public IReadOnlyList<Guid> VenueIds { get; }

    public PartnerContext(IHttpContextAccessor accessor, IPartnerRepository repo)
    {
        var ctx = accessor.HttpContext
            ?? throw new UnauthorizedException("No HTTP context");

        var sub = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? ctx.User.FindFirstValue("sub")
            ?? throw new UnauthorizedException("User ID not in token");
        UserId = Guid.Parse(sub);

        // Admins can also call partner endpoints with no partner profile; in
        // that case PartnerId is Guid.Empty and VenueIds is empty.
        var isAdmin = ctx.User.IsInRole("Admin") || ctx.User.IsInRole("admin");

        var partner = repo.GetByUserIdAsync(UserId, CancellationToken.None).GetAwaiter().GetResult();
        if (partner == null || !partner.IsActive)
        {
            if (isAdmin)
            {
                PartnerId = Guid.Empty;
                VenueIds = Array.Empty<Guid>();
                return;
            }
            throw new ForbiddenException("Partner profile not found or inactive");
        }

        PartnerId = partner.Id;
        VenueIds  = repo.GetVenueIdsAsync(partner.Id, CancellationToken.None).GetAwaiter().GetResult();
    }

    public void EnsureVenueAccess(Guid venueId)
    {
        if (PartnerId == Guid.Empty) return; // admin bypass
        if (!VenueIds.Contains(venueId))
            throw new ForbiddenException("You do not have access to manage this venue");
    }
}
