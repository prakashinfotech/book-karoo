---
description: Review code in current branch against coding standards
---

# Code Review

Review uncommitted changes + commits in the current branch (`git diff develop...HEAD`).

Check against `.claude/rules/coding-standards.md` (auto-loaded):

## Frontend
- [ ] No `any` in TypeScript
- [ ] Components < 300 lines
- [ ] Hooks for reusable logic
- [ ] Skeleton + error + empty states present
- [ ] Mobile responsive (test 360px)
- [ ] Accessible (ARIA, focus, keyboard)
- [ ] No inline styles
- [ ] Lazy-loaded routes

## Backend
- [ ] Controller is thin (model bind → service → return)
- [ ] Service has business logic
- [ ] Repository only does data access
- [ ] DTOs separate from entities
- [ ] Async + CancellationToken on all async methods
- [ ] FluentValidation present for new DTOs
- [ ] Serilog structured logging (no string concat)
- [ ] Custom exceptions (no generic Exception throw)

## Database
- [ ] Indexes on new reference columns
- [ ] Migration is idempotent
- [ ] Soft-delete respected (no hard DELETE)

## Git
- [ ] Conventional commit messages
- [ ] One logical change per commit
- [ ] No secrets, no console.log/Debug.WriteLine

## Output
Produce a markdown report with:
- ✅ Pass items
- ⚠️ Warnings (style/preference)
- ❌ Failures (must fix)

For each failure, cite file:line and propose fix.
