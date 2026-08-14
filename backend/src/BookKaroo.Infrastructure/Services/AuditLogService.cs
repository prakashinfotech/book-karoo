using System.Text.Json;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;

namespace BookKaroo.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly BookKarooDbContext _db;

    public AuditLogService(BookKarooDbContext db) => _db = db;

    public async Task LogAsync(
        Guid?   userId,
        string  action,
        string  entityType,
        Guid?   entityId,
        object? before,
        object? after,
        string? ip,
        CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            UserId     = userId,
            Action     = action,
            EntityType = entityType,
            EntityId   = entityId,
            Before     = before is null ? null : JsonSerializer.Serialize(before),
            After      = after  is null ? null : JsonSerializer.Serialize(after),
            Ip         = ip,
            CreatedAt  = DateTime.UtcNow,
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);
    }
}
