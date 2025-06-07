from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    is_superuser: bool = False

class UserLogin(BaseModel):
    username: str
    password: str

class UserInDB(UserBase):
    id: str
    is_active: bool
    is_superuser: bool
    created_at: str

    class Config:
        from_attributes = True

class User(UserInDB):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class SocialLogin(BaseModel):
    provider: str
    token: str
