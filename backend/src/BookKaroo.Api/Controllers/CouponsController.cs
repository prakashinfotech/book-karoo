using BookKaroo.Application.DTOs.Coupon;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/coupons")]
[Produces("application/json")]
public class CouponsController : ControllerBase
{
    private readonly ICouponService _coupons;

    public CouponsController(ICouponService coupons) => _coupons = coupons;

    /// <summary>Validate a coupon code against a show and ticket amount.</summary>
    [HttpPost("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CouponValidationResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Validate(
        [FromBody] ValidateCouponRequest request,
        CancellationToken ct)
    {
        var result = await _coupons.ValidateAsync(
            request.Code,
            request.ShowId,
            request.UserId,
            request.TicketAmount,
            ct);
        return Ok(result);
    }
}
