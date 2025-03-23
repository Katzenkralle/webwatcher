import strawberry
from enum import Enum
from typing import Annotated, Union, Optional

from backend.db_handler.maria_schemas import DbUser

from backend.utility.toolbox import extend_enum

class BaseResultType(Enum):
    SUCCESS = "success"
    AUTH_ERROR = "auth_error"
    PERMISSION_ERROR = "permission_error"
    FAILURE = "failure"
    NETWORK_ERROR = "network_error"
    WARNING = "warning"
    OK = "ok"
    NOT_OK = "not_ok"
    UNHEALTHY = "unhealthy"
    TIMEOUT = "timeout"
    CATS_AND_DOGS = "cats_and_dogs"

@strawberry.type
class JsonStr(str):
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

@extend_enum(BaseResultType)
@strawberry.enum
class ResultType(Enum):
    pass

# Base types
@strawberry.type
class User:
    username: str
    password: Optional[str]
    is_admin: bool

@strawberry.type()
class UserJobDisplayConfig:
    filter: str # JSON
    group: str # JSON

@strawberry.type
class Message:
    message: str
    status: ResultType

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

@strawberry.interface
class JobFullInfo:
    id: int

@strawberry.type
class JobMetaData(JobFullInfo):
    name: str
    description: str
    enabled: bool
    execute_timer: int
    executed_last: int
    forbid_dynamic_schema: bool
    expected_return_schema: Optional[JsonStr]

@strawberry.type
class JobSettings(JobFullInfo):
    parameters: list[Parameter]

@strawberry.type
class JobEntry:
    call_id: int
    timestamp: int
    runtime: int
    result: ResultType
    script_failure: bool
    context: JsonStr



UserResult = Annotated[Union[DbUser, Message], strawberry.union("UserResult")]
