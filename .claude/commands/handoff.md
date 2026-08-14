---
description: Generate handoff document at 80% context
---

# Handoff

Generate `/docs/HANDOFF.md` with current state of the project.

Include:

## 1. Status Per Feature
Table:
| Feature | Status | Branch | Notes |
|---|---|---|---|
| Auth signup/login | ✅ Done | merged | |
| Movies listing | 🚧 In progress | feat/movies-listing | filter sidebar pending |
| ... | | | |

## 2. Open PRs
List PRs with branch, link, blockers.

## 3. Known Bugs
List bugs with severity (P0/P1/P2), file:line, repro steps.

## 4. Architectural Decisions Made Mid-Flight
Anything that diverged from /docs/ARCHITECTURE.md, with rationale.

## 5. Next 5 Priorities
Ordered list with prompts to use:

1. **<feature>** — prompt: `/feature <feature-slug>`
2. ...

## 6. Environment Setup Recap
- Required `.env` keys
- Local services running
- Last successful migration

## 7. Credentials Checklist
- [ ] Supabase keys
- [ ] Razorpay test keys
- [ ] Resend API key
- [ ] TMDB API key
- [ ] Google Maps key (Phase 2)

## 8. Outstanding Questions
Any blockers requiring user decision.
