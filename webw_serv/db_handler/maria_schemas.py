from dataclasses import dataclass
import strawberry

@dataclass
class DbUser:
    username: str
    password: str
    is_admin: bool

@dataclass
class DbSession:
    username: str
    session_id: str
    name: str
    created: str

@dataclass
class DbUserDisplayConfig:
    username: str
    job_id: int
    filter_config: str
    graph_config: str


@dataclass
class DbParameter:
    key: str
    value: str

@dataclass
class DbScriptInfo:
    fs_path: str
    name: str
    description: str
    last_modified: str
    expected_return_schema: DbParameter
    input_schema: DbParameter
