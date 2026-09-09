# Phase 3 — Milestone 3.4: URL Analysis

| Field | Value |
|-------|-------|
| **Phase** | 3 — Core Platform Features |
| **Milestone** | 3.4: URL Analysis |
| **Started** | 2026-09-09 |
| **Target End** | 2026-09-09 |
| **Status** | Implemented & Verified (Uncommitted) |

## Sprint Objective

Implement a secure, robust public article URL analysis pipeline for VeritasAI supporting multi-layer SSRF defense (syntactic validation, DNS resolution, IP range rejection, redirect destination validation, and rebinding mitigations), safe HTTP streaming, boilerplate-free BeautifulSoup article body/title extraction, language detection, XLM-RoBERTa credibility/sentiment inference, authenticated history persistence, and frontend interactive UI.

## Prerequisites — VERIFIED

| Prerequisite | Status |
|---|---|
| Milestone 3.1: Analysis History Persistence | ✅ Done & Verified |
| Milestone 3.2: Analytics Dashboard | ✅ Implemented & Verified |
| Milestone 3.3: Authentication & IDOR Protection | ✅ Implemented & Verified |
| XLM-RoBERTa real inference pipeline | ✅ Verified |
| PostgreSQL database running / Alembic ready | ✅ Verified |
| React frontend running / building | ✅ Verified |

## Tasks

### Backend Authentication & Authorization
- [x] Create `User` database model (`backend/app/models/user.py`):
  - UUID primary key, unique email, unique username, hashed_password, is_active, timestamps, soft-delete
- [x] Create Alembic migration `671939c98ccd_create_users_table.py` with foreign key `fk_analysis_results_user_id_users` (`ondelete="SET NULL"`)
- [x] Create `backend/app/modules/auth/security.py`:
  - Secure bcrypt password hashing and verification
  - HS256 short-lived access tokens (15m) and refresh tokens (7d) using environment secrets
- [x] Create `backend/app/modules/auth/schemas.py`:
  - `RegisterRequest`, `LoginRequest`, `RefreshRequest`, `UserResponse`, `AuthResponse`
- [x] Create `backend/app/modules/auth/dependencies.py`:
  - `get_current_user`: extracts token, validates claims, fetches user from DB, enforces active status, raises 401
  - `get_optional_user`: allows anonymous access while parsing Bearer tokens when present
- [x] Create `backend/app/modules/auth/router.py`:
  - `POST /api/v1/auth/register` (201 Created, duplicate checking for email & username)
  - `POST /api/v1/auth/login` (200 OK, credential verification, JWT issuance)
  - `POST /api/v1/auth/refresh` (200 OK, refresh token exchange)
  - `POST /api/v1/auth/logout` (200 OK, session invalidation)
  - `GET /api/v1/auth/me` (200 OK, authenticated user profile)
- [x] Mount `auth_router` in `backend/app/main.py` under `/api/v1`

### IDOR Hardening & Scoping
- [x] Update `backend/app/modules/history/router.py`:
  - Require `current_user: User = Depends(get_current_user)` on list, item detail, and delete
  - Scope list query strictly to `AnalysisResult.user_id == current_user.id`
  - Enforce ownership check on `GET /history/{id}` and `DELETE /history/{id}`, returning 403 Forbidden for cross-user attempts
- [x] Update `backend/app/modules/dashboard/router.py`:
  - Require `current_user: User = Depends(get_current_user)`
  - Scope all KPI aggregations and distributions strictly to `AnalysisResult.user_id == current_user.id`
  - Ignore/disallow client-supplied `user_id` query parameters
- [x] Update `backend/app/modules/analysis/router.py`:
  - Associate analysis with `current_user.id` when authenticated
  - Roll back session on database save error to prevent transaction leakage

### Frontend Authentication & Protected Routes
- [x] Update `frontend/src/store/auth.store.ts`:
  - Token persistence in localStorage with loading state tracking
  - Synchronous hydration and reactive store updates
- [x] Update `frontend/src/services/api.ts`:
  - Added Auth types (`RegisterRequest`, `LoginRequest`, `AuthResponse`)
  - Added `registerUser()`, `loginUser()`, `logoutUser()`, `refreshAccessToken()`, `getCurrentUser()`
  - Axios request interceptor attaches Bearer token
  - Axios response interceptor handles 401 token refresh queue
- [x] Update `frontend/src/app/Providers.tsx`:
  - `AuthInitializer` validates token via `/auth/me` on startup
- [x] Update `frontend/src/app/Router.tsx`:
  - `ProtectedRoute` protects `/analyze`, `/history`, `/dashboard`
  - `GuestRoute` redirects authenticated users away from `/login` and `/register`
- [x] Update `frontend/src/features/auth/pages/LoginPage.tsx`:
  - Form validation with Zod + React Hook Form, safe error display
- [x] Update `frontend/src/features/auth/pages/RegisterPage.tsx`:
  - Form validation with Zod + React Hook Form, safe error display
- [x] Update `frontend/src/components/layout/Header.tsx`:
  - User badge dropdown showing username and email
  - Functional "Sign Out" action calling `logoutUser()`

### Testing & Verification
- [x] Added in-memory SQLite fixture with StaticPool in `backend/tests/conftest.py`
- [x] Implemented 14-point test suite in `backend/tests/integration/test_auth.py`
- [x] Verified full backend pytest suite (34 tests passed)
- [x] Verified Vitest tests (`src/app/App.test.tsx` passed)
- [x] Verified frontend production build (`tsc -b && vite build` succeeded with 0 errors)
- [x] Verified Alembic migration generation (`alembic upgrade head --sql` produces valid DDL)
- [x] Checked `git status`: NO commits, NO pushes, working tree preserved

## Definition of Done

1. ✅ Full auth lifecycle functional: register, login, refresh, logout, profile
2. ✅ Password security implemented with bcrypt; tokens implemented with HS256 JWT
3. ✅ Strict IDOR prevention: History and Dashboard strictly scoped to authenticated user
4. ✅ Protected routes enforced on both backend and frontend
5. ✅ Historical analysis records with nullable user_id preserved
6. ✅ 34 backend tests passing with 100% success rate
7. ✅ Frontend TypeScript and Vite build passing with 0 errors
8. ✅ Working tree uncommitted and ready for full Phase 3 user review

