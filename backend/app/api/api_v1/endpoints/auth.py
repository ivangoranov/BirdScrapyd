# Authentication endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any
from datetime import timedelta

from app.db.database import get_db
from app.models.models import User
from app.schemas.user import UserCreate, User as UserSchema, Token, SocialLogin
from app.core.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )

    # Return the token and user data
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_superuser": user.is_superuser
        }
    }


@router.post("/register", response_model=UserSchema)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Create new user
    """
    # Check if username already exists
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        is_superuser=user_in.is_superuser,
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Convert datetime to string before returning
    user_data = {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "is_active": db_user.is_active,
        "is_superuser": db_user.is_superuser,
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None
    }

    # Return the user data
    return user_data


@router.post("/social-login", response_model=Token)
def social_login(
    social_data: SocialLogin,
    db: Session = Depends(get_db)
) -> Any:
    """
    Login via social provider (placeholder for future implementation)
    """
    # This is a placeholder for future social login integration
    # For now, return an error to indicate this isn't fully implemented
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"Social login with {social_data.provider} not yet implemented"
    )


# Add a helper function to get the current user from a token
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current user from the token
    """
    from app.core.auth import decode_token

    token_data = decode_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == token_data.sub).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    return user


# Add a helper function to get a superuser
async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current user and verify they are a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )

    return current_user
