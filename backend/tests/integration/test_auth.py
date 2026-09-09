"""Integration tests for Authentication, Authorization, and IDOR prevention.

Covers:
1. Register valid user
2. Reject invalid registration (bad email, short password, bad username)
3. Reject duplicate email and duplicate username (409 Conflict)
4. Login with valid credentials
5. Reject invalid password and nonexistent email
6. GET /auth/me with valid authentication
7. GET /auth/me without authentication
8. POST /auth/logout
9. Protected endpoints require authentication (History and Dashboard)
10. Authenticated analysis persistence and ownership
11. User A cannot read User B's history (403 Forbidden)
12. User A cannot delete User B's history (403 Forbidden)
13. Dashboard only returns User A's statistics
14. User A cannot manipulate user_id query parameter to access User B's data
"""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import AnalysisResult


# ── Test Helpers ──

async def register_user(
    client: AsyncClient,
    email: str = "alice@example.com",
    username: str = "alice",
    password: str = "securepassword123",
    full_name: str | None = "Alice Smith",
) -> dict:
    """Helper to register a user and return the AuthResponse dict."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "username": username,
            "password": password,
            "full_name": full_name,
        },
    )
    assert response.status_code == 201
    return response.json()


# ── 1. Register Valid User ──


@pytest.mark.asyncio
async def test_register_valid_user(client: AsyncClient) -> None:
    """POST /api/v1/auth/register should create a user and return tokens."""
    data = await register_user(
        client,
        email="test_user@example.com",
        username="testuser",
        password="strongpassword123",
        full_name="Test User",
    )

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test_user@example.com"
    assert data["user"]["username"] == "testuser"
    assert data["user"]["full_name"] == "Test User"
    assert data["user"]["is_active"] is True
    assert "hashed_password" not in data["user"]
    assert "password" not in data["user"]


# ── 2. Reject Invalid Registration ──


@pytest.mark.asyncio
async def test_reject_invalid_registration(client: AsyncClient) -> None:
    """Reject invalid email, too-short password, and invalid username format."""
    # Invalid email
    res1 = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "username": "valid_user",
            "password": "validpassword123",
        },
    )
    assert res1.status_code == 422

    # Password too short (< 8 chars)
    res2 = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "valid@example.com",
            "username": "valid_user",
            "password": "short",
        },
    )
    assert res2.status_code == 422

    # Invalid username format (spaces or special characters)
    res3 = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "valid2@example.com",
            "username": "bad username!",
            "password": "validpassword123",
        },
    )
    assert res3.status_code == 422


# ── 3. Reject Duplicate Email and Username ──


@pytest.mark.asyncio
async def test_reject_duplicate_email_and_username(client: AsyncClient) -> None:
    """Reject duplicate email or username with 409 Conflict."""
    await register_user(client, email="duplicate@example.com", username="orig_user")

    # Duplicate email
    res_dup_email = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "username": "other_user",
            "password": "password123",
        },
    )
    assert res_dup_email.status_code == 409

    # Duplicate username
    res_dup_user = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "unique@example.com",
            "username": "orig_user",
            "password": "password123",
        },
    )
    assert res_dup_user.status_code == 409


# ── 4. Login with Valid Credentials ──


@pytest.mark.asyncio
async def test_login_valid_credentials(client: AsyncClient) -> None:
    """POST /api/v1/auth/login with correct credentials should return tokens."""
    await register_user(
        client,
        email="login_user@example.com",
        username="loginuser",
        password="mypassword123",
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "login_user@example.com",
            "password": "mypassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "login_user@example.com"


# ── 5. Reject Invalid Password ──


@pytest.mark.asyncio
async def test_reject_invalid_password(client: AsyncClient) -> None:
    """POST /api/v1/auth/login with wrong password or unknown email returns 401."""
    await register_user(
        client,
        email="pw_test@example.com",
        username="pwuser",
        password="correctpassword123",
    )

    # Wrong password
    res_wrong = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "pw_test@example.com",
            "password": "wrongpassword999",
        },
    )
    assert res_wrong.status_code == 401

    # Non-existent email
    res_nonexistent = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "correctpassword123",
        },
    )
    assert res_nonexistent.status_code == 401


# ── 6. /auth/me with Valid Authentication ──


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient) -> None:
    """GET /api/v1/auth/me returns the profile of the authenticated user."""
    auth_data = await register_user(
        client,
        email="me_test@example.com",
        username="meuser",
        password="password12345",
    )
    token = auth_data["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    profile = response.json()
    assert profile["email"] == "me_test@example.com"
    assert profile["username"] == "meuser"


# ── 7. /auth/me without Authentication ──


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient) -> None:
    """GET /api/v1/auth/me without token or with invalid token returns 401."""
    # No header
    res_none = await client.get("/api/v1/auth/me")
    assert res_none.status_code == 401

    # Invalid token
    res_invalid = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert res_invalid.status_code == 401


# ── 8. Logout Endpoint ──


@pytest.mark.asyncio
async def test_logout_endpoint(client: AsyncClient) -> None:
    """POST /api/v1/auth/logout should return 200 OK."""
    auth_data = await register_user(
        client,
        email="logout_user@example.com",
        username="logoutuser",
        password="password12345",
    )
    token = auth_data["access_token"]

    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"


# ── 9. Protected Endpoints Require Authentication ──


@pytest.mark.asyncio
async def test_protected_endpoints_require_authentication(client: AsyncClient) -> None:
    """History and Dashboard endpoints reject unauthenticated access with 401."""
    fake_id = uuid.uuid4()

    # History endpoints
    assert (await client.get("/api/v1/history")).status_code == 401
    assert (await client.get(f"/api/v1/history/{fake_id}")).status_code == 401
    assert (await client.delete(f"/api/v1/history/{fake_id}")).status_code == 401

    # Dashboard endpoint
    assert (await client.get("/api/v1/dashboard/summary")).status_code == 401


# ── 10. Authenticated Analysis Belongs to Current User ──


@pytest.mark.asyncio
async def test_authenticated_analysis_belongs_to_current_user(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Analysis records created for an authenticated user are assigned their user_id."""
    auth_data = await register_user(
        client,
        email="analyst@example.com",
        username="analyst",
        password="password123",
    )
    user_id = uuid.UUID(auth_data["user"]["id"])
    token = auth_data["access_token"]

    # Directly insert a record for this user
    record = AnalysisResult(
        id=uuid.uuid4(),
        user_id=user_id,
        input_type="text",
        original_text="Breaking: Major scientific breakthrough announced today.",
        detected_language="en",
        credibility_label="Real",
        credibility_score=0.95,
        sentiment_label="Positive",
        sentiment_score=0.88,
        confidence=0.915,
        processing_time_ms=120.5,
        is_mock=False,
    )
    db_session.add(record)
    await db_session.commit()

    # User fetches their history
    res = await client.get(
        "/api/v1/history",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == str(record.id)
    assert data["items"][0]["user_id"] == str(user_id)


# ── 11. User A Cannot Read User B's History (IDOR Prevention) ──


@pytest.mark.asyncio
async def test_user_a_cannot_read_user_b_history(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """User A cannot access User B's analysis records via list or detail."""
    user_a = await register_user(
        client, email="user_a@example.com", username="user_a", password="password123"
    )
    user_b = await register_user(
        client, email="user_b@example.com", username="user_b", password="password123"
    )

    user_a_token = user_a["access_token"]
    user_b_id = uuid.UUID(user_b["user"]["id"])

    # Create analysis owned by User B
    b_record = AnalysisResult(
        id=uuid.uuid4(),
        user_id=user_b_id,
        input_type="text",
        original_text="User B's private analysis content",
        detected_language="en",
        credibility_label="Fake",
        credibility_score=0.85,
        sentiment_label="Negative",
        sentiment_score=0.75,
        confidence=0.80,
        processing_time_ms=95.0,
        is_mock=False,
    )
    db_session.add(b_record)
    await db_session.commit()

    # 1. User A's history list must NOT include User B's record
    res_list = await client.get(
        "/api/v1/history",
        headers={"Authorization": f"Bearer {user_a_token}"},
    )
    assert res_list.status_code == 200
    assert res_list.json()["total"] == 0

    # 2. User A requesting User B's record by UUID must be rejected (403 Forbidden)
    res_detail = await client.get(
        f"/api/v1/history/{b_record.id}",
        headers={"Authorization": f"Bearer {user_a_token}"},
    )
    assert res_detail.status_code == 403


# ── 12. User A Cannot Delete User B's History ──


@pytest.mark.asyncio
async def test_user_a_cannot_delete_user_b_history(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """User A cannot delete User B's analysis record."""
    user_a = await register_user(
        client, email="deleter_a@example.com", username="deleter_a", password="password123"
    )
    user_b = await register_user(
        client, email="owner_b@example.com", username="owner_b", password="password123"
    )

    user_a_token = user_a["access_token"]
    user_b_id = uuid.UUID(user_b["user"]["id"])

    b_record = AnalysisResult(
        id=uuid.uuid4(),
        user_id=user_b_id,
        input_type="text",
        original_text="Record to protect from deletion",
        detected_language="en",
        credibility_label="Real",
        credibility_score=0.92,
        sentiment_label="Positive",
        sentiment_score=0.80,
        confidence=0.86,
        processing_time_ms=80.0,
        is_mock=False,
    )
    db_session.add(b_record)
    await db_session.commit()

    # User A tries to delete User B's record
    res_del = await client.delete(
        f"/api/v1/history/{b_record.id}",
        headers={"Authorization": f"Bearer {user_a_token}"},
    )
    assert res_del.status_code == 403

    # Verify record is still intact and not soft-deleted
    await db_session.refresh(b_record)
    assert b_record.deleted_at is None


# ── 13. Dashboard Only Returns User A's Statistics ──


@pytest.mark.asyncio
async def test_dashboard_only_returns_user_a_statistics(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Dashboard statistics are strictly scoped to the authenticated user."""
    user_a = await register_user(
        client, email="dash_a@example.com", username="dash_a", password="password123"
    )
    user_b = await register_user(
        client, email="dash_b@example.com", username="dash_b", password="password123"
    )

    user_a_token = user_a["access_token"]
    user_b_token = user_b["access_token"]
    user_a_id = uuid.UUID(user_a["user"]["id"])
    user_b_id = uuid.UUID(user_b["user"]["id"])

    # 2 records for User A (1 Real, 1 Fake)
    db_session.add(
        AnalysisResult(
            id=uuid.uuid4(),
            user_id=user_a_id,
            input_type="text",
            original_text="User A text 1",
            detected_language="en",
            credibility_label="Real",
            credibility_score=0.90,
            sentiment_label="Positive",
            sentiment_score=0.80,
            confidence=0.85,
            processing_time_ms=100.0,
            is_mock=False,
        )
    )
    db_session.add(
        AnalysisResult(
            id=uuid.uuid4(),
            user_id=user_a_id,
            input_type="text",
            original_text="User A text 2",
            detected_language="hi",
            credibility_label="Fake",
            credibility_score=0.80,
            sentiment_label="Negative",
            sentiment_score=0.70,
            confidence=0.75,
            processing_time_ms=110.0,
            is_mock=False,
        )
    )

    # 3 records for User B (all Real)
    for i in range(3):
        db_session.add(
            AnalysisResult(
                id=uuid.uuid4(),
                user_id=user_b_id,
                input_type="text",
                original_text=f"User B text {i}",
                detected_language="en",
                credibility_label="Real",
                credibility_score=0.95,
                sentiment_label="Positive",
                sentiment_score=0.90,
                confidence=0.925,
                processing_time_ms=90.0,
                is_mock=False,
            )
        )

    await db_session.commit()

    # User A's dashboard
    res_a = await client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {user_a_token}"},
    )
    assert res_a.status_code == 200
    dash_a = res_a.json()
    assert dash_a["total_analyses"] == 2
    assert dash_a["credibility_distribution"]["real_count"] == 1
    assert dash_a["credibility_distribution"]["fake_count"] == 1

    # User B's dashboard
    res_b = await client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {user_b_token}"},
    )
    assert res_b.status_code == 200
    dash_b = res_b.json()
    assert dash_b["total_analyses"] == 3
    assert dash_b["credibility_distribution"]["real_count"] == 3
    assert dash_b["credibility_distribution"]["fake_count"] == 0


# ── 14. User A Cannot Manipulate user_id to Access User B's Data ──


@pytest.mark.asyncio
async def test_user_a_cannot_manipulate_user_id_to_access_user_b_data(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Passing ?user_id=<user_b> in dashboard request is ignored; scopes to User A."""
    user_a = await register_user(
        client, email="tamper_a@example.com", username="tamper_a", password="password123"
    )
    user_b = await register_user(
        client, email="tamper_b@example.com", username="tamper_b", password="password123"
    )

    user_a_token = user_a["access_token"]
    user_a_id = uuid.UUID(user_a["user"]["id"])
    user_b_id = uuid.UUID(user_b["user"]["id"])

    # User A has 1 record
    db_session.add(
        AnalysisResult(
            id=uuid.uuid4(),
            user_id=user_a_id,
            input_type="text",
            original_text="User A record",
            detected_language="en",
            credibility_label="Real",
            credibility_score=0.90,
            sentiment_label="Positive",
            sentiment_score=0.85,
            confidence=0.875,
            processing_time_ms=100.0,
            is_mock=False,
        )
    )

    # User B has 5 records
    for i in range(5):
        db_session.add(
            AnalysisResult(
                id=uuid.uuid4(),
                user_id=user_b_id,
                input_type="text",
                original_text=f"User B record {i}",
                detected_language="en",
                credibility_label="Real",
                credibility_score=0.90,
                sentiment_label="Positive",
                sentiment_score=0.85,
                confidence=0.875,
                processing_time_ms=100.0,
                is_mock=False,
            )
        )
    await db_session.commit()

    # User A passes ?user_id=<user_b_id>
    response = await client.get(
        f"/api/v1/dashboard/summary?user_id={user_b_id}",
        headers={"Authorization": f"Bearer {user_a_token}"},
    )
    assert response.status_code == 200
    dash_data = response.json()
    # Must STILL return User A's data (1 analysis), NOT User B's (5 analyses)
    assert dash_data["total_analyses"] == 1
