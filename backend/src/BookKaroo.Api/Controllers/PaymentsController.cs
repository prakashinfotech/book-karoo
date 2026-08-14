using System.Security.Claims;
using BookKaroo.Application.DTOs.Booking;
using BookKaroo.Application.DTOs.Payment;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/payments")]
[Produces("application/json")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService     _payments;
    private readonly IWebHostEnvironment _env;
    private readonly ISettingRepository  _settings;
    private readonly IConfiguration      _config;

    public PaymentsController(
        IPaymentService     payments,
        IWebHostEnvironment env,
        ISettingRepository  settings,
        IConfiguration      config)
    {
        _payments = payments;
        _env      = env;
        _settings = settings;
        _config   = config;
    }

    /// <summary>Create a payment order and pending booking.</summary>
    [HttpPost("order")]
    [Authorize]
    [ProducesResponseType(typeof(CreateOrderResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> CreateOrder(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKeyHeader,
        [FromBody] CreateOrderRequest request,
        CancellationToken ct)
    {
        var maxSeatsStr = await _settings.GetAsync("max_seats_per_booking", ct);
        var maxSeats    = int.TryParse(maxSeatsStr, out var m) ? m : 10;

        if (request.Seats.Length == 0 || request.Seats.Length > maxSeats)
            return BadRequest($"seats must contain 1–{maxSeats} entries.");

        var effectiveKey = idempotencyKeyHeader ?? request.IdempotencyKey;
        if (string.IsNullOrWhiteSpace(effectiveKey))
            return BadRequest("Idempotency-Key header is required.");

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Merge the header key into the request so service can use it
        var req = request with { IdempotencyKey = effectiveKey };
        var result = await _payments.CreateOrderAsync(req, userId, ct);
        return Ok(result);
    }

    /// <summary>Simulate payment capture (non-production, mock provider only).</summary>
    [HttpPost("mock-capture")]
    [Authorize]
    [ProducesResponseType(typeof(BookingDetailResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> MockCapture(
        [FromBody] MockCaptureRequest request,
        CancellationToken ct)
    {
        if (_env.IsProduction()) return NotFound();
        if ((_config["PAYMENT_PROVIDER"] ?? "mock").ToLowerInvariant() != "mock")
            return NotFound();

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _payments.MockCaptureAsync(
            request.ProviderOrderId, userId, request.SimulateFailure, ct);
        return Ok(result);
    }

    /// <summary>Verify Razorpay payment signature and finalize booking.</summary>
    [HttpPost("verify")]
    [Authorize]
    [ProducesResponseType(typeof(BookingDetailResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> VerifyPayment(
        [FromBody] VerifyPaymentRequest request,
        CancellationToken ct)
    {
        var result = await _payments.VerifyPaymentAsync(request, ct);
        return Ok(result);
    }
}
