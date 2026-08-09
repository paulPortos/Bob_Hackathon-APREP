"""Cryptographic helpers used by authentication and endpoint-token storage."""

from datetime import datetime, timedelta
from typing import Optional

from cryptography.fernet import Fernet
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
token_cipher = Fernet(settings.encryption_key.encode())


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_context.verify(password, hashed_password)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expires_at = datetime.utcnow() + (
        expires_delta or timedelta(days=settings.jwt_expiration_days)
    )
    return jwt.encode(
        {
            "sub": subject,
            "exp": expires_at,
            "iss": settings.jwt_issuer,
            "aud": settings.jwt_audience,
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            options={"require_exp": True, "require_sub": True},
        )
        return payload.get("sub")
    except JWTError:
        return None


def encrypt_token(token: str) -> str:
    return token_cipher.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    return token_cipher.decrypt(encrypted_token.encode()).decode()
