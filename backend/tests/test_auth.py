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


def test_admin_login_and_privilege_separation():
    """Validates separate admin credentials, token role claim, and administrative access control."""
    # 1. Login as Admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@phishfree.io",
        "password": "AdminPassword123!",
        "remember_me": True
    })
    assert admin_login.status_code == 200
    admin_data = admin_login.json()
    assert admin_data["user"]["role"] == "admin"
    admin_token = admin_data["access_token"]

    # 2. Admin access to administrative overview
    status_res = client.get("/api/v1/auth/admin/status", headers={"Authorization": f"Bearer {admin_token}"})
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "operational"
    assert status_res.json()["role"] == "admin"
    assert status_res.json()["metrics"]["total_registered_users"] >= 2

    # 3. Admin access to user list
    users_res = client.get("/api/v1/auth/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert users_res.status_code == 200
    assert isinstance(users_res.json(), list)

    # 4. Standard analyst login
    analyst_login = client.post("/api/v1/auth/login", json={
        "email": "analyst@phishfree.io",
        "password": "Password123!"
    })
    assert analyst_login.status_code == 200
    analyst_token = analyst_login.json()["access_token"]

    # 5. Non-admin attempting to access admin endpoints is rejected with 403 Forbidden
    forbidden_res = client.get("/api/v1/auth/admin/status", headers={"Authorization": f"Bearer {analyst_token}"})
    assert forbidden_res.status_code == 403
    assert "Administrative privileges required" in forbidden_res.json()["detail"]

    forbidden_users = client.get("/api/v1/auth/admin/users", headers={"Authorization": f"Bearer {analyst_token}"})
    assert forbidden_users.status_code == 403

    # 6. Unauthenticated request rejected with 401 Unauthorized
    unauth_res = client.get("/api/v1/auth/admin/status")
    assert unauth_res.status_code == 401


