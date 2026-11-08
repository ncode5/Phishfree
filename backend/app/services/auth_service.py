import re
import secrets
import hashlib
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
from collections import defaultdict

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import models, schemas
from app.database.connection import get_db

# Initialize Argon2id password hasher with secure, production-grade memory and parallelism parameters
_password_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32
)

# In-memory sliding window rate limiter for authentication endpoints
# Structure: { key: [timestamp, timestamp, ...] }
_rate_limit_windows: Dict[str, list] = defaultdict(list)


class AuthService:
    """Enterprise authentication service handling Argon2id hashing, JWT sessions, and rate limiting."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hashes plaintext password using Argon2id."""
        return _password_hasher.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifies plaintext against Argon2id hash with constant-time verification."""
        try:
            return _password_hasher.verify(hashed_password, plain_password)
        except (VerifyMismatchError, InvalidHashError):
            return False
        except Exception:
            return False

    @staticmethod
    def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
        """Enforces NIST-compliant password strength policy."""
        if len(password) < 8:
            return False, "Password must be at least 8 characters in length."
        if len(password) > 128:
            return False, "Password must not exceed 128 characters."
        if not re.search(r"\d", password):
            return False, "Password must include at least one numerical digit (0-9)."
        if not (re.search(r"[A-Z]", password) or re.search(r"[!@#$%^&*(),.?\":{}|<>]", password)):
            return False, "Password must include at least one uppercase letter or special character."
        return True, None

    @staticmethod
    def check_rate_limit(key: str, max_attempts: int = 5, window_seconds: int = 300) -> bool:
        """
        Sliding-window rate limiter protecting against brute-force attacks and credential stuffing.
        Returns True if request is allowed, False if limit exceeded.
        """
        now = time.time()
        # Clean timestamps older than window
        _rate_limit_windows[key] = [t for t in _rate_limit_windows[key] if now - t < window_seconds]
        if len(_rate_limit_windows[key]) >= max_attempts:
            return False
        _rate_limit_windows[key].append(now)
        return True

    @staticmethod
    def create_jwt_token(user_id: str, email: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
        """Generates cryptographically signed JWT access token."""
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        payload = {
            "sub": user_id,
            "email": email.lower().strip(),
            "role": role,
            "iat": datetime.now(timezone.utc),
            "exp": expire,
            "iss": "phishfree-auth"
        }

        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
        """Validates and decodes JWT token. Returns payload or None if invalid/expired."""
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                issuer="phishfree-auth"
            )
            return payload
        except jwt.PyJWTError:
            return None

    @staticmethod
    def hash_reset_token(raw_token: str) -> str:
        """Produces SHA-256 digest of password reset token before database persistence."""
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    # ====================================================
    # User Lifecycle Operations
    # ====================================================

    @classmethod
    def register_user(cls, payload: schemas.UserRegisterRequest, db: Session) -> Tuple[models.User, str]:
        """Registers a new security analyst account."""
        normalized_email = payload.email.lower().strip()

        # Check existing user
        existing = db.query(models.User).filter(models.User.email == normalized_email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        # Validate password strength
        is_strong, err_msg = cls.validate_password_strength(payload.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err_msg
            )

        hashed = cls.hash_password(payload.password)
        user = models.User(
            email=normalized_email,
            full_name=payload.full_name.strip(),
            hashed_password=hashed,
            role="security_analyst",
            is_active=1,
            is_verified=1,
            created_at=datetime.now(timezone.utc),
            last_login_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = cls.create_jwt_token(user.id, user.email, user.role)
        return user, token

    @classmethod
    def authenticate_user(
        cls,
        email: str,
        password: str,
        remember_me: bool,
        client_ip: str,
        db: Session
    ) -> Tuple[models.User, str]:
        """Authenticates user credentials and issues access token."""
        normalized_email = email.lower().strip()
        rate_key = f"login:{client_ip}:{normalized_email}"

        if not cls.check_rate_limit(rate_key, max_attempts=6, window_seconds=300):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts. Please wait 5 minutes before trying again."
            )

        user = db.query(models.User).filter(models.User.email == normalized_email).first()
        if not user or not cls.verify_password(password, user.hashed_password):
            # Generic response prevents account enumeration
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated. Please contact your platform administrator."
            )

        # Update last login timestamp
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()

        # Token duration based on remember_me
        expires = timedelta(days=settings.REMEMBER_ME_EXPIRE_DAYS) if remember_me else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = cls.create_jwt_token(user.id, user.email, user.role, expires_delta=expires)
        return user, token

    @classmethod
    def create_password_reset_request(cls, email: str, client_ip: str, db: Session) -> Tuple[bool, Optional[str]]:
        """
        Initiates password reset request. Generates cryptographically secure token.
        Returns (success, dev_token).
        """
        rate_key = f"forgot:{client_ip}"
        if not cls.check_rate_limit(rate_key, max_attempts=4, window_seconds=600):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many password reset requests. Please try again later."
            )

        normalized_email = email.lower().strip()
        user = db.query(models.User).filter(models.User.email == normalized_email).first()
        if not user:
            # Silent return prevents email enumeration
            return True, None

        # Invalidate previous unused tokens for this user
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.user_id == user.id,
            models.PasswordResetToken.is_used == 0
        ).update({"is_used": 1})

        raw_token = secrets.token_urlsafe(32)
        token_hash = cls.hash_reset_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        reset_record = models.PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            is_used=0,
            created_at=datetime.now(timezone.utc)
        )
        db.add(reset_record)
        db.commit()

        # In development or when email provider is absent, return the token for local testing
        return True, raw_token

    @classmethod
    def reset_password(cls, payload: schemas.ResetPasswordRequest, db: Session) -> bool:
        """Validates token and updates user password with Argon2id."""
        token_hash = cls.hash_reset_token(payload.token.strip())
        reset_record = db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.token_hash == token_hash,
            models.PasswordResetToken.is_used == 0
        ).first()

        now = datetime.now(timezone.utc)
        # Ensure UTC timezone comparability
        if not reset_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or already utilized password reset token."
            )

        rec_exp = reset_record.expires_at
        if rec_exp.tzinfo is None:
            rec_exp = rec_exp.replace(tzinfo=timezone.utc)

        if now > rec_exp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset token has expired. Please request a new link."
            )

        # Validate new password strength
        is_strong, err_msg = cls.validate_password_strength(payload.new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err_msg
            )

        user = db.query(models.User).filter(models.User.id == reset_record.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account associated with this token could not be found."
            )

        # Update password and mark token as used
        user.hashed_password = cls.hash_password(payload.new_password)
        reset_record.is_used = 1
        db.commit()
        return True


# ====================================================
# FastAPI Dependencies
# ====================================================

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> models.User:
    """
    FastAPI dependency extracting credentials from either:
    1. HTTP Authorization: Bearer <token> header
    2. Secure, HttpOnly cookie `phishfree_session`
    """
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()

    if not token:
        # Fall back to session cookie
        token = request.cookies.get(settings.SESSION_COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = AuthService.decode_jwt_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(models.User).filter(models.User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist or has been disabled.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """Optional authentication dependency for endpoints that support both anonymous and logged-in users."""
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


def get_current_admin_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """FastAPI dependency requiring platform administrator authorization."""
    if current_user.role not in ("admin", "superadmin", "secops_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource."
        )
    return current_user


