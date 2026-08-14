namespace BookKaroo.Application.DTOs.Payment;

public class VerifyPaymentRequest
{
    public string RazorpayOrderId   { get; set; } = string.Empty;
    public string RazorpayPaymentId { get; set; } = string.Empty;
    public string RazorpaySignature { get; set; } = string.Empty;
}
