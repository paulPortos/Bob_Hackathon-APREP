"""Authentication use cases."""

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.identity.auth import UserLogin, UserRegister


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def register(self, user_data: UserRegister) -> User:
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise ConflictError("Email already registered")

        user = User(email=user_data.email, hashed_password=hash_password(user_data.password))
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, credentials: UserLogin) -> str:
        user = self.db.query(User).filter(User.email == credentials.email).first()
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise UnauthorizedError("Incorrect email or password")
        return create_access_token(user.id)
