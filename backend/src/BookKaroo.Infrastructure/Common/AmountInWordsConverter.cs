namespace BookKaroo.Infrastructure.Common;

public static class AmountInWordsConverter
{
    private static readonly string[] Units =
        ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
         "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
         "Seventeen", "Eighteen", "Nineteen"];

    private static readonly string[] Tens =
        ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    public static string Convert(decimal amount)
    {
        long rupees = (long)Math.Floor(amount);
        int paise = (int)Math.Round((amount - rupees) * 100);

        string words = ToIndianWords(rupees) + " Rupee(s)";
        words += paise > 0
            ? " And " + ToIndianWords(paise) + " Paisa"
            : " And Zero Paisa";

        return words + " Only.";
    }

    private static string ToIndianWords(long n)
    {
        if (n == 0) return "Zero";
        if (n < 0) return "Minus " + ToIndianWords(-n);

        var parts = new List<string>();

        if (n >= 10_000_000) // Crore
        {
            parts.Add(ToIndianWords(n / 10_000_000) + " Crore");
            n %= 10_000_000;
        }
        if (n >= 100_000) // Lakh
        {
            parts.Add(ToIndianWords(n / 100_000) + " Lakh");
            n %= 100_000;
        }
        if (n >= 1_000) // Thousand
        {
            parts.Add(ToIndianWords(n / 1_000) + " Thousand");
            n %= 1_000;
        }
        if (n >= 100)
        {
            parts.Add(Units[n / 100] + " Hundred");
            n %= 100;
        }
        if (n >= 20)
        {
            parts.Add(Tens[n / 10] + (n % 10 != 0 ? " " + Units[n % 10] : ""));
        }
        else if (n > 0)
        {
            parts.Add(Units[n]);
        }

        return string.Join(" ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
    }
}
