using System.Text.RegularExpressions;
using BookKaroo.Application.DTOs.Lys;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Application.Services;

public class LysOrganizerService : ILysOrganizerService
{
    private readonly ILysOrganizerRepository _repo;
    private readonly IUserRepository         _users;
    private readonly IEmailService           _email;
    private readonly ILogger<LysOrganizerService> _logger;

    private static readonly Regex PanRegex = new(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", RegexOptions.Compiled);

    public LysOrganizerService(
        ILysOrganizerRepository repo,
        IUserRepository         users,
        IEmailService           email,
        ILogger<LysOrganizerService> logger)
    {
        _repo   = repo;
        _users  = users;
        _email  = email;
        _logger = logger;
    }

    public async Task<LysOrganizerResponse> RegisterAsync(
        RegisterOrganizerRequest req, Guid userId, CancellationToken ct = default)
    {
        var existing = await _repo.GetByUserIdAsync(userId, ct);
        if (existing != null)
            throw new ConflictException("You already have an organizer account.");

        if (!PanRegex.IsMatch(req.PanNumber.ToUpperInvariant()))
            throw new AppException("Invalid PAN format. Expected format: ABCDE1234F");

        if (await _repo.PanExistsAsync(req.PanNumber.ToUpperInvariant(), null, ct))
            throw new ConflictException("This PAN number is already registered.");

        var organizer = new LysOrganizer
        {
            UserId     = userId,
            Name       = req.Name.Trim(),
            Email      = req.Email.Trim().ToLowerInvariant(),
            Phone      = req.Phone.Trim(),
            PanNumber  = req.PanNumber.ToUpperInvariant(),
            IsVerified = false,
            IsActive   = true,
        };

        await _repo.AddAsync(organizer, ct);

        _ = Task.Run(async () =>
        {
            try { await _email.SendLysOrganizerWelcomeAsync(organizer.Email, organizer.Name); }
            catch (Exception ex) { _logger.LogError(ex, "LYS welcome email failed for {Email}", organizer.Email); }
        }, ct);

        return MapToResponse(organizer);
    }

    public async Task<LysOrganizerResponse?> GetMyProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var organizer = await _repo.GetByUserIdAsync(userId, ct);
        return organizer == null ? null : MapToResponse(organizer);
    }

    public async Task<LysOrganizerResponse> UpdateProfileAsync(
        Guid userId, UpdateOrganizerRequest req, CancellationToken ct = default)
    {
        var organizer = await _repo.GetByUserIdAsync(userId, ct)
            ?? throw new NotFoundException("Organizer profile not found.");

        if (!string.IsNullOrWhiteSpace(req.Name))  organizer.Name  = req.Name.Trim();
        if (!string.IsNullOrWhiteSpace(req.Phone)) organizer.Phone = req.Phone.Trim();

        await _repo.UpdateAsync(organizer, ct);
        return MapToResponse(organizer);
    }

    public async Task<bool> IsOrganizerAsync(Guid userId, CancellationToken ct = default) =>
        await _repo.GetByUserIdAsync(userId, ct) != null;

    private static LysOrganizerResponse MapToResponse(LysOrganizer o) => new()
    {
        Id         = o.Id,
        UserId     = o.UserId,
        Name       = o.Name,
        Email      = o.Email,
        Phone      = o.Phone,
        PanNumber  = o.PanNumber,
        IsVerified = o.IsVerified,
        IsActive   = o.IsActive,
        VerifiedAt = o.VerifiedAt,
        CreatedAt  = o.CreatedAt,
    };
}
