# Token Optimization — How Claude Should Work in This Project

> Guidance for managing context window efficiently. Read-heavy sessions burn tokens fast.

## Start of Every Session

1. `CLAUDE.md` — constraints and tech stack (always in context via auto-load)
2. `.claude/rules/*.md` — auto-loaded, already in context
3. `docs/STATUS.md` — what's done, what's not. 2 min read, saves hours of misaligned work.
4. `docs/HANDOFF.md` — check the date. If recent (< 1 week), start here to resume.

## Reading Strategy by Task Type

| Task | Read These Docs | Skip |
|------|----------------|------|
| Backend feature | BACKEND.md, DATABASE.md, API.md | FRONTEND.md, DESIGN-SYSTEM.md |
| Frontend feature | FRONTEND.md, DESIGN-SYSTEM.md | BACKEND.md, DATABASE.md |
| Bug fix | STATUS.md § Known Limitations, then specific files | All unrelated docs |
| Database change | DATABASE.md | API.md, FRONTEND.md |
| Payment/GST work | ARCHITECTURE.md, COMPANY-DETAILS.md | GIT-WORKFLOW.md |
| Full end-to-end feature | Use the /feature skill | Read docs inline as needed |

## File Size Reference (to decide whether to grep or read whole)

| File | Lines | Strategy |
|------|-------|---------|
| `docs/PRD.md` | ~1024 | Grep for section headings — never read whole |
| `docs/HANDOFF.md` | ~400 | Read in full — it's a snapshot |
| `docs/ARCHITECTURE.md` | ~200 | Read in full |
| `docs/DATABASE.md` | ~200 | Read in full |
| `docs/STATUS.md` | ~150 | Read in full |
| `docs/API.md` | ~100 | Read in full |

## Grep Before Read
For source code files, search for the specific symbol/function before opening the whole file:
```bash
grep -r "BookingService" backend/src --include="*.cs" -l
grep -r "useMovies" frontend/src --include="*.ts" -l
```

## Scope Discipline
- Implement one feature at a time: backend endpoint → frontend hook → frontend component → test
- Commit each logical unit before starting the next
- Don't open files outside the scope of the current task
- If a file is > 300 lines, read only the relevant method's surrounding context

## When to Generate HANDOFF.md
At ~80% context usage (`/handoff` command):
- What was completed this session (with file paths)
- What's in progress (exact file + line context)
- What's blocked or pending decision
- What to do next (ordered by priority)

## Large Codebase Patterns
- Frontend features are in `frontend/src/features/{feature}/` — read only the relevant feature
- Backend services are in `backend/src/BookKaroo.Application/Services/` — read only the service you're changing
- Migrations are numbered — read only the latest ones unless debugging a schema issue
- Don't read `node_modules/`, `dist/`, `bin/`, `obj/` — never useful
