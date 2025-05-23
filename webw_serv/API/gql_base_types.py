import strawberry
from enum import Enum
from typing import Annotated, Union, Optional, Any, List, Dict

from webw_serv.db_handler.maria_schemas import DbUser, DbSession, DbUserDisplayConfig, DbJobMetaData, DbScriptInfo, DbParameter

from webw_serv.utility.toolbox import extend_enum

class MessageType(Enum):
    SECONDARY = "secondary"
    SUCCESS = "success"
    INFO = "info"
    WARN = "warn"
    HELP = "help"
    DANGER = "danger" 
    CONTRAST = "contrast"
    AUTH_ERROR = "auth_error"


@strawberry.scalar
class JsonStr(str):
    pass

@strawberry.scalar
class B64Str(str):
    pass

# Helper types
@strawberry.input
class PaginationInput:
    max: int
    start_element: int
    newest_first: Optional[bool] = True

@strawberry.type
class Parameter(DbParameter):
    pass


# Base types
@strawberry.type()
class User(DbUser):
    password: strawberry.Private[str]

@strawberry.type()
class UserList():
    users: list[User]

@strawberry.type
class Session(DbSession):
    # This is a private field, it will not be exposed in the schema
    session_id: strawberry.Private[str]

@strawberry.type
class SessionList():
    sessions: list[Session]

@strawberry.type()
class UserDisplayConfig(DbUserDisplayConfig):
    graph_config: Optional[JsonStr]
    filter_config: Optional[JsonStr]
    hidden_cols_config: Optional[JsonStr]

@strawberry.type
class Message:
    message: str
    status: MessageType

@strawberry.type
class ScriptContent(DbScriptInfo):
    input_schema: list[Parameter]

@strawberry.type
class ScriptValidationResult:
    valid: bool
    available_parameters: list[Parameter]
    supports_static_schema: bool
    validation_msg: str
    id: str


@strawberry.type
class JobMetaData(DbJobMetaData):
    id: int
    expected_return_schema: Optional[list[Parameter]]

@strawberry.type
class JobSettings:
    id: int
    parameters: Optional[list[Parameter]] = None

@strawberry.type
@strawberry.interface
class JobFullInfo(JobMetaData, JobSettings):
    id: int

@strawberry.type
class JobEntry:
    call_id: int
    timestamp: str
    runtime: float
    error_msg: str
    script_failure: bool
    context: Optional[JsonStr] = None


@strawberry.input
class JobEntyInput(JobEntry):
    call_id: Optional[int] = None

UserResult = Annotated[Union[User, Message], strawberry.union("UserResult")]
AllUsersResult = Annotated[Union[UserList, Message], strawberry.union("AllUsersResult")]
SessionResult = Annotated[Union[SessionList, Message], strawberry.union("SessionResult")] 