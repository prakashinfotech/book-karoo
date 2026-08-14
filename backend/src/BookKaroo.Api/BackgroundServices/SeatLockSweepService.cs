using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;

namespace BookKaroo.Api.BackgroundServices;

public class SeatLockSweepService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SeatLockSweepService> _logger;

    public SeatLockSweepService(IServiceScopeFactory scopeFactory, ILogger<SeatLockSweepService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SeatLockSweepService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);

            using var scope        = _scopeFactory.CreateScope();
            var seatLockSvc        = scope.ServiceProvider.GetRequiredService<ISeatLockService>();
            var eventTicketLockRepo = scope.ServiceProvider.GetRequiredService<IEventTicketLockRepository>();

            try
            {
                var count = await seatLockSvc.SweepExpiredAsync(stoppingToken);
                if (count > 0)
                    _logger.LogInformation("Swept {Count} expired seat locks", count);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error sweeping expired seat locks");
            }

            try
            {
                var eventCount = await eventTicketLockRepo.DeleteExpiredLocksAsync(stoppingToken);
                if (eventCount > 0)
                    _logger.LogInformation("Swept {Count} expired event ticket locks", eventCount);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error sweeping expired event ticket locks");
            }
        }

        _logger.LogInformation("SeatLockSweepService stopped.");
    }
}
