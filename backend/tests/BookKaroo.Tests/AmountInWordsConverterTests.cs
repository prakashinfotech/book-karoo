using BookKaroo.Application.Common;
using FluentAssertions;

namespace BookKaroo.Tests;

public class AmountInWordsConverterTests
{
    [Theory]
    [InlineData(156.94,    "One Hundred Fifty Six Rupee(s) And Ninety Four Paisa Only.")]
    [InlineData(1056.94,   "One Thousand Fifty Six Rupee(s) And Ninety Four Paisa Only.")]
    [InlineData(100000.00, "One Lakh Rupee(s) And Zero Paisa Only.")]
    [InlineData(1000.00,   "One Thousand Rupee(s) And Zero Paisa Only.")]
    [InlineData(606.94,    "Six Hundred Six Rupee(s) And Ninety Four Paisa Only.")]
    [InlineData(150000.00, "One Lakh Fifty Thousand Rupee(s) And Zero Paisa Only.")]
    [InlineData(1.00,      "One Rupee(s) And Zero Paisa Only.")]
    [InlineData(0.50,      "Zero Rupee(s) And Fifty Paisa Only.")]
    [InlineData(329.62,    "Three Hundred Twenty Nine Rupee(s) And Sixty Two Paisa Only.")]
    [InlineData(10000000.00, "One Crore Rupee(s) And Zero Paisa Only.")]
    public void Convert_ReturnsCorrectWords(double amount, string expected)
    {
        var result = AmountInWordsConverter.Convert((decimal)amount);
        result.Should().Be(expected);
    }
}
