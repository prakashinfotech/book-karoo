namespace BookKaroo.Application.Interfaces.Services;

public interface IAuditLogService
{
    Task LogAsync(
        Guid?   userId,
        string  action,
        string  entityType,
        Guid?   entityId,
        object? before,
        object? after,
        string? ip,
        CancellationToken ct = default);
}
