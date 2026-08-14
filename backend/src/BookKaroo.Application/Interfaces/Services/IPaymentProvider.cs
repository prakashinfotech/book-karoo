using BookKaroo.Application.DTOs.Payment;

namespace BookKaroo.Application.Interfaces.Services;

public interface IPaymentProvider
{
    string ProviderName { get; }
    Task<PaymentOrder> CreateOrderAsync(ProviderOrderRequest request, CancellationToken ct = default);
    Task<PaymentCapture> CaptureAsync(string providerOrderId, CancellationToken ct = default);
    Task<RefundResult> RefundAsync(string providerPaymentId, decimal amount, CancellationToken ct = default);
    Task<bool> VerifyWebhookSignatureAsync(string payload, string signature, CancellationToken ct = default);
}
