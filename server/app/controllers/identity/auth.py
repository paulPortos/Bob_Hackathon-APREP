"""Authentication controller."""

from sqlalchemy.orm import Session

from app.models import User
from app.schemas.identity.auth import UserLogin, UserRegister
from app.services.identity.auth import AuthService


class AuthController:
    def register(self, db: Session, data: UserRegister) -> User:
        return AuthService(db).register(data)

    def login(self, db: Session, data: UserLogin) -> dict[str, str]:
        return {"access_token": AuthService(db).login(data), "token_type": "bearer"}

    def get_current_user(self, user: User) -> User:
        return user


auth_controller = AuthController()
