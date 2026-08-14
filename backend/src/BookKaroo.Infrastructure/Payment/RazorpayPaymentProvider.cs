using System.Security.Cryptography;
using System.Text;
using BookKaroo.Application.DTOs.Payment;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Razorpay.Api;

namespace BookKaroo.Infrastructure.Payment;

public class RazorpayPaymentProvider : IPaymentProvider
{
    public string ProviderName => "razorpay";

    private readonly string                           _keyId;
    private readonly string                           _keySecret;
    private readonly RazorpayClient                   _client;
    private readonly ILogger<RazorpayPaymentProvider> _logger;

    public RazorpayPaymentProvider(IConfiguration config, ILogger<RazorpayPaymentProvider> logger)
    {
        _logger = logger;

        _keyId     = config["RAZORPAY_KEY_ID"]
            ?? throw new InvalidOperationException("RAZORPAY_KEY_ID is required when PAYMENT_PROVIDER=razorpay.");
        _keySecret = config["RAZORPAY_KEY_SECRET"]
            ?? throw new InvalidOperationException("RAZORPAY_KEY_SECRET is required when PAYMENT_PROVIDER=razorpay.");

        _client = new RazorpayClient(_keyId, _keySecret);
    }

    public Task<PaymentOrder> CreateOrderAsync(ProviderOrderRequest request, CancellationToken ct = default)
    {
        var options = new Dictionary<string, object>
        {
            { "amount",          (long)(request.Amount * 100) }, // paise
            { "currency",        request.Currency },
            { "receipt",         Guid.NewGuid().ToString("N") },
            { "payment_capture", 1 },
        };

        var rzpOrder = _client.Order.Create(options);
        // Razorpay SDK returns dynamic — cast to string explicitly
        var orderId  = (string)rzpOrder["id"];

        _logger.LogInformation(
            "Razorpay order created: {RazorpayOrderId} for amount {Amount} {Currency}",
            orderId, (decimal)request.Amount, request.Currency);

        var order = new PaymentOrder(
            OrderId:         orderId,
            Provider:        ProviderName,
            ProviderOrderId: orderId,
            Amount:          request.Amount,
            Currency:        request.Currency,
            CheckoutUrl:     null,
            ProviderKey:     _keyId,
            RazorpayKeyId:   _keyId);

        return Task.FromResult(order);
    }

    public Task<PaymentCapture> CaptureAsync(string providerOrderId, CancellationToken ct = default)
    {
        // Capture happens via the /verify endpoint using HMAC signature — not via this method.
        throw new NotImplementedException(
            "Razorpay uses client-side payment + server-side signature verification. Use VerifyPaymentSignature.");
    }

    public Task<RefundResult> RefundAsync(string providerPaymentId, decimal amount, CancellationToken ct = default)
    {
        var options = new Dictionary<string, object>
        {
            { "amount", (long)(amount * 100) }, // paise
        };

        try
        {
            // SDK: fetch payment then call Refund on the instance
            var payment  = _client.Payment.Fetch(providerPaymentId);
            var refund   = payment.Refund(options);
            var refundId = (string)refund["id"];

            _logger.LogInformation(
                "Razorpay refund created: {RefundId} for payment {PaymentId}",
                refundId, providerPaymentId);

            return Task.FromResult(new RefundResult(
                Success:  true,
                RefundId: refundId,
                Error:    null));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Razorpay refund failed for payment {PaymentId}", providerPaymentId);
            return Task.FromResult(new RefundResult(
                Success:  false,
                RefundId: null,
                Error:    ex.Message));
        }
    }

    public Task<bool> VerifyWebhookSignatureAsync(string payload, string signature, CancellationToken ct = default)
    {
        // Webhook verification is out of scope for Phase 1.
        // The /payments/verify endpoint uses VerifyPaymentSignature instead.
        return Task.FromResult(false);
    }

    /// <summary>
    /// Verifies Razorpay payment signature using HMAC-SHA256.
    /// payload = orderId + "|" + paymentId
    /// expected = HMAC(payload, KEY_SECRET).ToLowerHex()
    /// </summary>
    public bool VerifyPaymentSignature(string orderId, string paymentId, string signature)
    {
        var payload    = $"{orderId}|{paymentId}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_keySecret));
        var expected   = BitConverter.ToString(
            hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)))
            .Replace("-", "")
            .ToLowerInvariant();

        return expected == signature;
    }
}
