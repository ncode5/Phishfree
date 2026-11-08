import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_cors_allowed_local_frontend():
    """Verify local frontend dev origins are allowed."""
    for origin in ["http://localhost:5173", "http://127.0.0.1:5173"]:
        response = client.options(
            "/api/v1/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type"
            }
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == origin


def test_cors_allowed_vercel_preview():
    """Verify production Vercel deployment preview domain regex matches safely."""
    origin = "https://phishfree-preview-test.vercel.app"
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin


def test_cors_disallowed_external_origins():
    """Verify unauthorized external domains and unlisted ports are rejected."""
    unauthorized = [
        "https://evil-attacker.com",
        "https://phishing-site.org",
        "http://localhost:9999",
        "https://notvercel.app.attacker.com"
    ]
    for origin in unauthorized:
        response = client.options(
            "/api/v1/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type"
            }
        )
        assert response.headers.get("access-control-allow-origin") is None

