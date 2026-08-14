using BookKaroo.Application.DTOs.Payment;
using FluentValidation;

namespace BookKaroo.Application.Validators;

public class VerifyPaymentRequestValidator : AbstractValidator<VerifyPaymentRequest>
{
    public VerifyPaymentRequestValidator()
    {
        RuleFor(x => x.RazorpayOrderId).NotEmpty();
        RuleFor(x => x.RazorpayPaymentId).NotEmpty();
        RuleFor(x => x.RazorpaySignature).NotEmpty();
    }
}
