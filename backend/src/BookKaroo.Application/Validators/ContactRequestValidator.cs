using BookKaroo.Application.DTOs.Help;
using FluentValidation;

namespace BookKaroo.Application.Validators;

public class ContactRequestValidator : AbstractValidator<ContactRequest>
{
    public ContactRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Subject).NotEmpty().MinimumLength(5).MaximumLength(150);
        RuleFor(x => x.Message).NotEmpty().MinimumLength(20).MaximumLength(2000);
        RuleFor(x => x.BookingRef).MaximumLength(20).When(x => x.BookingRef is not null);
    }
}
