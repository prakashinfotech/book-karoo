---
description: Run all tests and lint, report failures
---

# Test & Lint

Run the full test + lint suite for BookKaroo:

## Backend
```bash
cd backend
dotnet build --no-restore
dotnet test --no-build --logger "console;verbosity=normal"
```

## Frontend
```bash
cd frontend
npm run lint
npm run typecheck
npm run test
```

## Reporting
After running, report:
- Total tests run, passed, failed
- Coverage % (if available)
- Any lint warnings
- Specific failure stack traces

If anything fails, propose a fix plan but do NOT auto-fix without asking.
