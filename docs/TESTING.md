# BookKaroo — Testing Guide

> Coverage target: ≥70% on services. ≥90% on critical paths (booking, seat locking, GST).
>
> **Current state (be honest about this before you plan around it):**
> - **Backend:** 4 real test files exist in `backend/tests/BookKaroo.Tests/` — `AmountInWordsConverterTests.cs`, `AuthServiceTests.cs`, `CityServiceTests.cs`, `PricingServiceTests.cs`. No booking, seat-lock, or repository/integration tests exist yet.
> - **Frontend:** no test tooling is installed at all — no Vitest, no React Testing Library, no MSW, no `test` script in `frontend/package.json`. Only `npm run typecheck` runs today.
>
> Everything below is the **target pattern** to follow once you add tests in these areas — not a description of what's already there.

## Backend Testing (xUnit + Moq + FluentAssertions)

### Target Test Project Structure

```
backend/tests/BookKaroo.Tests/
├── AmountInWordsConverterTests.cs   ✅ exists
├── AuthServiceTests.cs              ✅ exists
├── CityServiceTests.cs              ✅ exists
├── PricingServiceTests.cs           ✅ exists
├── Services/                        ← not yet created
│   ├── BookingServiceTests.cs
│   └── SeatLockServiceTests.cs
├── Validators/                      ← not yet created
│   └── CreateBookingRequestValidatorTests.cs
└── Repositories/                    ← not yet created — integration tests (hit real test DB)
    └── BookingRepositoryTests.cs
```

### Unit Test Pattern (AAA)

```csharp
public class BookingServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepo = new();
    private readonly Mock<ISeatLockRepository> _seatLockRepo = new();
    private readonly Mock<IPricingService> _pricing = new();
    private readonly Mock<ILogger<BookingService>> _logger = new();

    private BookingService CreateSut() =>
        new(_bookingRepo.Object, _seatLockRepo.Object, _pricing.Object, _logger.Object);

    [Fact]
    public async Task CreateAsync_WhenSeatsAvailable_ReturnsConfirmedBooking()
    {
        // Arrange
        var showId = Guid.NewGuid();
        var request = new CreateBookingRequest { ShowId = showId, SeatIds = [Guid.NewGuid()] };
        _seatLockRepo
            .Setup(r => r.GetByShowAndUserAsync(showId, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new SeatLock { SeatId = request.SeatIds[0] }]);
        _pricing
            .Setup(p => p.Calculate(It.IsAny<decimal>(), 1, It.IsAny<string>(), false))
            .Returns(new PricingBreakdown(200m, 59m, 0m, cgst: 5.31m, sgst: 5.31m, igst: 0m));

        // Act
        var result = await CreateSut().CreateAsync(request, Guid.NewGuid(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(BookingStatus.Confirmed);
        _bookingRepo.Verify(r => r.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WhenSeatNotLocked_ThrowsConflictException()
    {
        // Arrange — no locks returned
        _seatLockRepo
            .Setup(r => r.GetByShowAndUserAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        // Act + Assert
        await CreateSut()
            .Invoking(s => s.CreateAsync(new CreateBookingRequest(), Guid.NewGuid(), CancellationToken.None))
            .Should().ThrowAsync<ConflictException>();
    }
}
```

### Test Naming Convention

`MethodName_Condition_ExpectedResult`

```
GetAllAsync_WithGenreFilter_ReturnsOnlyMatchingMovies
LockSeatAsync_WhenAlreadyLocked_ThrowsConflictException
Calculate_IntraStateWithCoupon_ReturnsCgstSgstBreakdown
Calculate_InterState_ReturnsIgstBreakdown
CreateAsync_WhenPaymentFails_DoesNotCreateBooking
RefreshToken_WithExpiredToken_ThrowsUnauthorizedException
```

### Validator Tests

```csharp
public class LoginRequestValidatorTests
{
    private readonly LoginRequestValidator _validator = new();

    [Theory]
    [InlineData("")]
    [InlineData("notanemail")]
    [InlineData("missing@")]
    public async Task Email_InvalidFormat_FailsValidation(string email)
    {
        var result = await _validator.TestValidateAsync(new LoginRequest { Email = email, Password = "valid123" });
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public async Task Password_TooShort_FailsValidation()
    {
        var result = await _validator.TestValidateAsync(new LoginRequest { Email = "a@b.com", Password = "short" });
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }
}
```

### GST Pricing Tests (critical — 100% coverage required)

```csharp
public class PricingServiceTests
{
    private readonly PricingService _sut = new(Mock.Of<ISettingsRepository>());

    [Theory]
    [InlineData("24", 1, false, 0.09, 0.09, 0.00)]   // Intra-state Gujarat, no coupon
    [InlineData("24", 2, true,  0.09, 0.09, 0.00)]   // Intra-state, with coupon
    [InlineData("27", 1, false, 0.00, 0.00, 0.18)]   // Inter-state Maharashtra, no coupon
    [InlineData("07", 1, true,  0.00, 0.00, 0.18)]   // Inter-state Delhi, with coupon
    public void Calculate_StateAndCoupon_CorrectTaxSplit(
        string stateCode, int qty, bool hasCoupon,
        decimal expectedCgstRate, decimal expectedSgstRate, decimal expectedIgstRate)
    {
        var result = _sut.Calculate(200m, qty, stateCode, hasCoupon);

        var taxable = (59m + (hasCoupon ? 15m : 0m)) * qty;
        result.Cgst.Should().Be(taxable * expectedCgstRate);
        result.Sgst.Should().Be(taxable * expectedSgstRate);
        result.Igst.Should().Be(taxable * expectedIgstRate);
    }
}
```

### Running Backend Tests

```bash
cd backend
dotnet test                                    # all tests
dotnet test --filter "Category=Unit"          # unit only
dotnet test --collect:"XPlat Code Coverage"  # with coverage

# View coverage
reportgenerator -reports:coverage.xml -targetdir:coverage-html -reporttypes:Html
```

---

## Frontend Testing (Target: Vitest + React Testing Library + MSW)

> Not installed yet. To start: `npm install -D vitest @testing-library/react @testing-library/user-event msw jsdom` in `frontend/`, add a `test` script, and configure Vitest in `vite.config.ts`. Everything below is the intended pattern once that's done.

### Test Co-location (required)

```
features/movies/
├── components/
│   ├── MovieCard.tsx
│   └── MovieCard.test.tsx      ← co-located
├── hooks/
│   ├── useMovies.ts
│   └── useMovies.test.ts       ← co-located
└── pages/
    ├── MovieListPage.tsx
    └── MovieListPage.test.tsx
```

### Component Test Pattern

```typescript
// Test user behavior, not implementation details
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovieCard } from './MovieCard';
import { mockMovie } from '@/tests/fixtures';

describe('MovieCard', () => {
  it('renders title, rating, and genres', () => {
    render(<MovieCard movie={mockMovie} />);

    expect(screen.getByText(mockMovie.title)).toBeInTheDocument();
    expect(screen.getByText(`${mockMovie.rating}/10`)).toBeInTheDocument();
    expect(screen.getByText(mockMovie.genres[0])).toBeInTheDocument();
  });

  it('shows skeleton while image is loading', () => {
    render(<MovieCard movie={{ ...mockMovie, posterUrl: undefined }} />);
    expect(screen.getByTestId('poster-skeleton')).toBeInTheDocument();
  });

  it('navigates to movie detail on click', async () => {
    const user = userEvent.setup();
    render(<MovieCard movie={mockMovie} />);

    await user.click(screen.getByRole('link', { name: mockMovie.title }));
    expect(window.location.pathname).toBe(`/movies/${mockMovie.id}`);
  });
});
```

### API Mocking with MSW

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { mockMovies, mockBooking } from './fixtures';

export const handlers = [
  http.get('/api/movies', () => HttpResponse.json({ items: mockMovies, total: mockMovies.length })),
  http.post('/api/seat-locks', () => HttpResponse.json({ id: 'lock-1', expiresAt: new Date().toISOString() })),
  http.post('/api/payments/order', () => HttpResponse.json({ orderId: 'order-1', providerOrderId: 'mock-1', amount: 318 })),
  http.post('/api/payments/mock-capture', () => HttpResponse.json(mockBooking)),
];

// Error scenario override (in a specific test)
server.use(
  http.get('/api/movies', () => HttpResponse.json({ message: 'Server error' }, { status: 500 }))
);
```

### Hook Test Pattern

```typescript
// hooks/useMovies.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/tests/utils';  // wraps with QueryClientProvider
import { useMovies } from './useMovies';

it('fetches movies and returns them', async () => {
  const { result } = renderHook(() => useMovies(), { wrapper: createWrapper() });

  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.items).toHaveLength(mockMovies.length);
});

it('returns error state when API fails', async () => {
  server.use(http.get('/api/movies', () => HttpResponse.json({}, { status: 500 })));

  const { result } = renderHook(() => useMovies(), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error).toBeTruthy();
});
```

### What to Test vs. What to Skip

| Test This | Skip This |
|-----------|-----------|
| User interactions (click, type, submit) | Internal state variables |
| Loading, error, and empty states | Implementation details |
| Form validation messages | CSS class names |
| Navigation after actions | Snapshot tests (fragile) |
| Conditional rendering | Third-party component internals |

### Running Frontend Tests (once set up)

```bash
cd frontend
npm test                  # watch mode
npm run test:run          # CI one-shot
npm run test:coverage     # with V8 coverage
npm run test:ui           # Vitest UI browser
```

### Running Frontend Checks (today)

```bash
cd frontend
npm run typecheck   # tsc --noEmit — the only automated check that exists right now
```

---

## Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| Services (backend) | ≥70% | High |
| Booking + Seat lock + GST | ≥90% | Critical |
| FluentValidation validators | 100% | Critical |
| Frontend hooks | ≥70% | High |
| Frontend components (key flows) | ≥60% | Medium |
| Repositories | Integration tests for critical queries | High |

---

*Related: [docs/BACKEND.md](BACKEND.md) | [docs/FRONTEND.md](FRONTEND.md)*
