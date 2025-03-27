from dataclasses import dataclass
import strawberry

@strawberry.type
@dataclass
class DbUser:
    username: str
    password: str
    is_admin: bool