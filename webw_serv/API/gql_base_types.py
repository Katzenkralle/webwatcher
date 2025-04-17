import strawberry
from enum import Enum
from typing import Annotated, Union, Optional

from webw_serv.db_handler.maria_schemas import DbUser, DbSession, DbUserDisplayConfig

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

@strawberry.type
class Parameter:
    key: str
    value: str


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

@strawberry.type
class Message:
    message: str
    status: MessageType

@strawberry.type
class ScriptContent:
    name: str
    description: str
    modify_at: int
    available_parameters: list[Parameter]
    static_schema: list[Parameter]

@strawberry.type
class ScriptValidationResult:
    valid: bool
    available_parameters: list[Parameter]
    supports_static_schema: bool
    validation_msg: str
    id: str


@strawberry.type
class JobMetaData:
    id: int
    name: str
    description: str
    enabled: bool
    execute_timer: int
    executed_last: int
    forbid_dynamic_schema: bool
    expected_return_schema: Optional[JsonStr]

@strawberry.type
class JobSettings:
    int: int
    parameters: list[Parameter]

@strawberry.type
@strawberry.interface
class JobFullInfo(JobMetaData, JobSettings):
    id: int

@strawberry.type
class JobEntry:
    call_id: int
    timestamp: int
    runtime: int
    error_msg: str
    script_failure: bool
    context: Optional[JsonStr] = None


@strawberry.input
class JobEntyInput(JobEntry):
    call_id: Optional[int] = None

UserResult = Annotated[Union[User, Message], strawberry.union("UserResult")]
AllUsersResult = Annotated[Union[UserList, Message], strawberry.union("AllUsersResult")]
SessionResult = Annotated[Union[SessionList, Message], strawberry.union("SessionResult")] 