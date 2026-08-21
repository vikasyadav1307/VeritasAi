# AI Rules — VeritasAI

> Mandatory rules for every AI development session.

## Code Rules

1. **Understand before modifying** — read the relevant file, check architecture, then make the smallest appropriate change.
2. **Clean Architecture** — dependencies point inward only. No cross-module direct imports; use service protocols.
3. **SOLID principles** in all modules.
4. **Type safety** — full type annotations on all functions and methods.
5. **Pydantic V2** for all request/response schemas.
6. **Async everywhere** — FastAPI routes, SQLAlchemy queries, httpx calls.
7. **All endpoints** must have `response_model` + `status_code`.
8. **Structured logging** — use `structlog`. Never use `print()`.
9. **No secrets in code** — use `.env` and `app.config.settings`.
10. **No unnecessary dependencies** — explain why any new dependency is needed.
11. **No hardcoded values** — API keys, passwords, tokens, DB credentials go in env vars.

## Documentation Rules

### Must Update After Work

| Document | When |
|----------|------|
| `ai_context.md` | Every session (current state only — not history) |
| `09_PROGRESS_LOG.md` | Every sprint completion |
| `10_TECHNICAL_DECISIONS.md` | When a meaningful tech decision is made |
| `12_CHANGELOG.md` | For meaningful project changes |
| Current sprint doc | When sprint tasks change |

### Document-Specific Rules

- **`04_DATABASE_DESIGN.md`** — update for any schema change
- **`05_API_SPECIFICATION.md`** — update for any endpoint change
- **`06_AI_PIPELINE.md`** — update for any model/pipeline change
- **`ai_context.md`** — keep SHORT. Current state only. Remove outdated info. Never append history.

## Git Rules

### Commit Format
```
type(scope): subject
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

**Examples**:
```
feat(analysis): add confidence breakdown to response
fix(detection): handle empty text input gracefully
docs(ai-context): update sprint 2 status
test(analysis): add validation edge case tests
```

**Never use**: `update`, `final`, `changes`, `working`, `new`

### Branch Format
```
type/short-description
```

## Testing Rules

A feature is not done just because it runs. Test:
- Normal input
- Invalid input
- Edge cases
- Error paths

## Token Efficiency

- Do NOT read the entire repository
- Do NOT repeat the entire architecture
- Do NOT regenerate existing documentation
- Do NOT inspect unrelated files
- Request only what is necessary for the current task

## No Fake Completion

Never mark a task as completed unless it has been:
- **Implemented** — code written
- **Tested** — tests pass or manually verified
- **Documented** — relevant docs updated

## Session Handoff

Before finishing a session:
1. Test the work
2. List files created/modified
3. Update `ai_context.md`
4. Update progress log
5. Define the exact next task
