using BookKaroo.Application.DTOs.Payment;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.Extensions.Hosting;

namespace BookKaroo.Infrastructure.Payment;

public class MockPaymentProvider : IPaymentProvider
{
    public string ProviderName => "mock";

    public MockPaymentProvider(IHostEnvironment env)
    {
        if (env.IsProduction())
            throw new InvalidOperationException(
                "MockPaymentProvider must not be used in Production. Set PAYMENT_PROVIDER=razorpay.");
    }

    public Task<PaymentOrder> CreateOrderAsync(ProviderOrderRequest request, CancellationToken ct = default)
    {
        var order = new PaymentOrder(
            OrderId: Guid.NewGuid().ToString(),
            Provider: ProviderName,
            ProviderOrderId: $"MOCK-{Guid.NewGuid():N}",
            Amount: request.Amount,
            Currency: request.Currency,
            CheckoutUrl: null,
            ProviderKey: null);

        return Task.FromResult(order);
    }

    public Task<PaymentCapture> CaptureAsync(string providerOrderId, CancellationToken ct = default)
    {
        var capture = new PaymentCapture(
            ProviderOrderId: providerOrderId,
            ProviderPaymentId: $"MOCK-PAY-{Guid.NewGuid():N}",
            Success: true,
            Error: null);

        return Task.FromResult(capture);
    }

    public Task<RefundResult> RefundAsync(string providerPaymentId, decimal amount, CancellationToken ct = default)
    {
        var result = new RefundResult(
            Success: true,
            RefundId: $"MOCK-REFUND-{Guid.NewGuid():N}",
            Error: null);

        return Task.FromResult(result);
    }

    public Task<bool> VerifyWebhookSignatureAsync(string payload, string signature, CancellationToken ct = default) =>
        Task.FromResult(true);
}
