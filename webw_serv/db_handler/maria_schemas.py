from dataclasses import dataclass
import strawberry

@strawberry.type
@dataclass
class DbUser:
    username: str
    password: str
    is_admin: bool

@dataclass
class DbScriptInfo:
    fs_path: str
    name: str
    description: str
    excpected_return_schema: dict[str, str]
    input_schema: dict[str, str]