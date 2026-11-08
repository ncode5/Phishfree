import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal, init_db
from app.database import models

init_db()
client = TestClient(app)


def test_login_demo_analyst():
    """Validates login with default seeded demo analyst account."""
    res = client.post("/api/v1/auth/login", json={
        "email": "analyst@phishfree.io",
        "password": "Password123!",
        "remember_me": True
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "analyst@phishfree.io"
    assert data["user"]["full_name"] == "Ankur Giri"
    assert "phishfree_session" in res.cookies


def test_login_invalid_password():
    """Validates failure response on invalid password."""
    res = client.post("/api/v1/auth/login", json={
        "email": "analyst@phishfree.io",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password."


def test_register_and_login_flow():
    """Tests registration, duplicate check, and subsequent login flow."""
    test_email = "test.security.analyst@phishfree.io"

    # Cleanup if exists
    with SessionLocal() as db:
        old = db.query(models.User).filter(models.User.email == test_email).first()
        if old:
            db.delete(old)
            db.commit()

    # 1. Register new user
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Test Cyber Analyst",
        "email": test_email,
        "password": "SecurePassword2026!",
        "terms_accepted": True
    })
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["email"] == test_email
    assert data["user"]["full_name"] == "Test Cyber Analyst"
    token = data["access_token"]

    # 2. Duplicate registration rejection
    dup_res = client.post("/api/v1/auth/register", json={
        "full_name": "Duplicate User",
        "email": test_email,
        "password": "SecurePassword2026!"
    })
    assert dup_res.status_code == 409

    # 3. Access protected /me endpoint with token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email

    # 4. Access protected /me endpoint with cookie
    client.cookies.set("phishfree_session", token)
    me_cookie_res = client.get("/api/v1/auth/me")
    assert me_cookie_res.status_code == 200
    assert me_cookie_res.json()["email"] == test_email


def test_password_reset_workflow():
    """Validates forgot password token generation and password reset submission."""
    test_email = "reset.test@phishfree.io"

    # Ensure user exists
    with SessionLocal() as db:
        old = db.query(models.User).filter(models.User.email == test_email).first()
        if not old:
            from app.services.auth_service import AuthService
            u = models.User(
                email=test_email,
                full_name="Reset Tester",
                hashed_password=AuthService.hash_password("InitialPassword123!"),
                role="security_analyst",
                is_active=1
            )
            db.add(u)
            db.commit()

    # Request reset token
    forgot_res = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
    assert forgot_res.status_code == 200
    token = forgot_res.json().get("dev_reset_token")
    assert token is not None

    # Submit reset password
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "token": token,
        "new_password": "NewSecurePassword2026!"
    })
    assert reset_res.status_code == 200

    # Verify login with new password
    login_res = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "NewSecurePassword2026!"
    })
    assert login_res.status_code == 200

