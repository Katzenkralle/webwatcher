from dataclasses import dataclass
from typing import Optional
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
    hidden_cols_config: str


@dataclass
class DbParameter:
    key: str
    value: str

@dataclass
class DbJobMetaData:
    id: int
    name: str
    script: str
    description: str
    enabled: bool
    execute_timer: str
    executed_last: Optional[str]
    forbid_dynamic_schema: bool
    expected_return_schema: Optional[list[DbParameter]]

@dataclass
class DbScriptInfo:
    fs_path: str
    name: str
    description: str
    last_modified: str
    input_schema: DbParameter
    supports_static_schema: bool
