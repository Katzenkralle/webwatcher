from dataclasses import dataclass

@dataclass
class DbUser:
    username: str
    password: str
    is_admin: bool

@dataclass
class DbSession:
    username: str
    session_id: str
    expiration: int | None = None