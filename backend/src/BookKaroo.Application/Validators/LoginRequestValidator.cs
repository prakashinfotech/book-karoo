using BookKaroo.Application.DTOs.Auth;
using FluentValidation;

namespace BookKaroo.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Identifier).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}
