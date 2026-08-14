using BookKaroo.Application.DTOs.Events;
using FluentValidation;

namespace BookKaroo.Application.Validators;

public class CreateEventOrderRequestValidator : AbstractValidator<CreateEventOrderRequest>
{
    public CreateEventOrderRequestValidator()
    {
        RuleFor(r => r.EventId).NotEmpty();
        RuleFor(r => r.TierName).NotEmpty();
        RuleFor(r => r.Quantity).InclusiveBetween(1, 10);
        RuleFor(r => r.IdempotencyKey).NotEmpty();
    }
}
