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
    name: str
    created: str

@dataclass
class DbUserDisplayConfig:
    username: str
    job_id: int
    filter_config: str
    graph_config: str