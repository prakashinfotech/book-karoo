using BookKaroo.Application.DTOs.Admin;
using FluentValidation;

namespace BookKaroo.Application.Validators;

public class CreateShowRequestValidator : AbstractValidator<CreateShowRequest>
{
    private static readonly string[] ValidFormats =
        ["2D", "3D", "IMAX", "IMAX-3D", "4DX", "Dolby Cinema", "EPIQ", "MX4D"];

    public CreateShowRequestValidator()
    {
        RuleFor(r => r.ScreenId).NotEmpty().WithMessage("Screen is required.");

        RuleFor(r => r.Format)
            .NotEmpty()
            .Must(f => ValidFormats.Contains(f))
            .WithMessage($"Format must be one of: {string.Join(", ", ValidFormats)}");

        RuleFor(r => r.Language).NotEmpty().WithMessage("Language is required.");

        RuleFor(r => r.ShowDate)
            .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today))
            .WithMessage("Show date must be today or in the future.");

        RuleFor(r => r)
            .Must(r => r.MovieId.HasValue ^ r.EventId.HasValue)
            .WithMessage("Exactly one of MovieId or EventId must be provided.");
    }
}
