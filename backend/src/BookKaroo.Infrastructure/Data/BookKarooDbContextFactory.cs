using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BookKaroo.Infrastructure.Data;

/// <summary>
/// Design-time factory so 'dotnet ef migrations' works without the startup project.
/// Connection string is read from the environment variable DATABASE_URL.
/// </summary>
public class BookKarooDbContextFactory : IDesignTimeDbContextFactory<BookKarooDbContext>
{
    public BookKarooDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Host=localhost;Port=5432;Database=bookkaroo_dev;Username=postgres;Password=postgres";

        // Normalise postgresql:// URI if needed (same logic as Program.cs)
        if (connectionString.StartsWith("postgresql://") || connectionString.StartsWith("postgres://"))
            connectionString = NormalizeUri(connectionString);

        var options = new DbContextOptionsBuilder<BookKarooDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new BookKarooDbContext(options);
    }

    private static string NormalizeUri(string cs)
    {
        var withoutScheme = cs[(cs.IndexOf("://", StringComparison.Ordinal) + 3)..];
        var lastAt = withoutScheme.LastIndexOf('@');
        var userInfo = withoutScheme[..lastAt];
        var hostPart = withoutScheme[(lastAt + 1)..];

        var colonIdx = userInfo.IndexOf(':');
        var username = colonIdx >= 0 ? Uri.UnescapeDataString(userInfo[..colonIdx]) : Uri.UnescapeDataString(userInfo);
        var password = colonIdx >= 0 ? Uri.UnescapeDataString(userInfo[(colonIdx + 1)..]) : string.Empty;

        var slashIdx = hostPart.IndexOf('/');
        var hostPort = slashIdx >= 0 ? hostPart[..slashIdx] : hostPart;
        var database = slashIdx >= 0 ? hostPart[(slashIdx + 1)..] : "postgres";

        var portColon = hostPort.LastIndexOf(':');
        var host = portColon >= 0 ? hostPort[..portColon] : hostPort;
        var port = portColon >= 0 ? hostPort[(portColon + 1)..] : "5432";

        return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }
}
