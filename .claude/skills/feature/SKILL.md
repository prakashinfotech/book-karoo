---
description: Implement a feature end-to-end with backend + frontend + tests + git flow
---

# Feature Implementation

You are implementing the feature: **$ARGUMENTS**

Follow this checklist strictly:

## 0. Read Context
- Read `/CLAUDE.md`
- Read `.claude/rules/coding-standards.md` (auto-loaded — review if needed)
- Read relevant section of `/docs/PRD.md`
- Read `/docs/API.md` for endpoint contracts
- Read `/docs/DATABASE.md` for schema

## 1. Plan
- State which files you will create/modify
- State which API endpoints you will add
- State which DB tables/columns you will touch
- Wait for user confirmation before coding (unless they said "go ahead")

## 2. Git
- `git checkout develop && git pull`
- `git checkout -b feat/$ARGUMENTS`

## 3. Backend (if applicable)
- Add Domain entity (if new)
- Add Repository interface in Application + implementation in Infrastructure
- Add Service interface + implementation
- Add DTOs (request/response)
- Add FluentValidation validator
- Add Controller
- Wire up DI in Program.cs
- Add unit tests (xUnit) for the service
- Run: `dotnet build && dotnet test`

## 4. Frontend (if applicable)
- Create feature folder under `/frontend/src/features/<feature>`
- Add types.ts
- Add API hooks (TanStack Query)
- Add components (with skeleton, error, empty states)
- Add page component
- Add route in router with lazy import
- Mobile-responsive
- Accessible (ARIA, keyboard)
- Add tests (Vitest)

## 5. Docs
- Update `/docs/API.md` if endpoints changed
- Update `/docs/DATABASE.md` if schema changed

## 6. Commit
- Logical commits, conventional format:
  - `feat($ARGUMENTS): <subject>`
- Push: `git push -u origin feat/$ARGUMENTS`

## 7. Summary
Report:
- Files created/modified
- Endpoints added
- Tests passing
- Branch name and commit SHAs
- Next suggested feature
