from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import models, schemas
from app.database.connection import get_db
from app.services.auth_service import AuthService, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])


def _set_auth_cookie(response: Response, token: str, remember_me: bool = False):
    """Sets secure, HttpOnly session cookie on the response."""
    max_age = (
        settings.REMEMBER_ME_EXPIRE_DAYS * 24 * 3600
        if remember_me
        else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    # On production (HTTPS) or when explicitly configured, use secure=True
    is_secure = settings.COOKIE_SECURE or (settings.ENVIRONMENT == "production")

    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=max_age,
        expires=max_age,
        httponly=True,
        secure=is_secure,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )


def _clear_auth_cookie(response: Response):
    """Clears the session cookie."""
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite=settings.COOKIE_SAMESITE
    )


@router.post(
    "/register",
    response_model=schemas.AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new cybersecurity analyst account"
)
async def register(
    payload: schemas.UserRegisterRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Registers a new platform user with Argon2id-hashed credentials and issues a secure session."""
    user, token = AuthService.register_user(payload, db)
    _set_auth_cookie(response, token, remember_me=False)

    return schemas.AuthResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=bool(user.is_active),
            is_verified=bool(user.is_verified),
            created_at=user.created_at,
            last_login_at=user.last_login_at
        ),
        message="Registration successful. Welcome to PhishFree."
    )


@router.post(
    "/login",
    response_model=schemas.AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate security analyst credentials"
)
async def login(
    payload: schemas.UserLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticates credentials against Argon2id hash with brute-force rate-limiting and issues a session."""
    client_ip = request.client.host if request.client else "unknown"
    user, token = AuthService.authenticate_user(
        email=payload.email,
        password=payload.password,
        remember_me=payload.remember_me,
        client_ip=client_ip,
        db=db
    )
    _set_auth_cookie(response, token, remember_me=payload.remember_me)

    return schemas.AuthResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=bool(user.is_active),
            is_verified=bool(user.is_verified),
            created_at=user.created_at,
            last_login_at=user.last_login_at
        ),
        message="Authentication successful."
    )


@router.post(
    "/logout",
    response_model=schemas.AuthMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Sign out and invalidate current session"
)
async def logout(response: Response):
    """Clears the HttpOnly session cookie and signals the client to discard in-memory tokens."""
    _clear_auth_cookie(response)
    return schemas.AuthMessageResponse(
        success=True,
        message="Session successfully terminated."
    )


@router.get(
    "/me",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve current authenticated analyst profile"
)
async def get_me(current_user: models.User = Depends(get_current_user)):
    """Validates session token and returns active analyst metadata."""
    return schemas.UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=bool(current_user.is_active),
        is_verified=bool(current_user.is_verified),
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at
    )


@router.post(
    "/forgot-password",
    response_model=schemas.ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a single-use password reset token"
)
async def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Generates a secure, time-limited reset token with rate-limiting.
    Does not reveal whether an email address exists in the database.
    """
    client_ip = request.client.host if request.client else "unknown"
    _, dev_token = AuthService.create_password_reset_request(payload.email, client_ip, db)

    # In development or test environments, surface the reset URL helper
    dev_url = None
    if dev_token:
        # Determine base URL for reset link
        origin = request.headers.get("origin") or "http://localhost:5173"
        dev_url = f"{origin}/reset-password?token={dev_token}"

    return schemas.ForgotPasswordResponse(
        success=True,
        message="If an account with this email exists, password reset instructions have been dispatched.",
        dev_reset_token=dev_token if settings.ENVIRONMENT == "development" else None,
        dev_reset_url=dev_url if settings.ENVIRONMENT == "development" else None
    )


@router.post(
    "/reset-password",
    response_model=schemas.AuthMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete password reset using single-use token"
)
async def reset_password(
    payload: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Validates single-use token and updates password using Argon2id."""
    AuthService.reset_password(payload, db)
    return schemas.AuthMessageResponse(
        success=True,
        message="Password has been successfully updated. You may now sign in with your new credentials."
    )

