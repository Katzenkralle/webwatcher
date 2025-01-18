import strawberry
from enum import Enum
from typing import Annotated, Union

from db_handler.maria_schemas import *

@strawberry.enum
class ResultType(Enum):
    SUCCESS = "success"
    AUTH_ERROR = "auth_error"
    PREMISSION_ERROR = "premission_error"
    FAILURE = "failure"
    NETWORK_ERROR = "network_error"
    WARNING = "warning"
    OK = "ok"
    NOT_OK = "not_ok"
    UNHEALTHY = "unhealthy"
    TIMEOUT = "timeout"
    CATS_AND_DOGS = "cats_and_dogs"

@strawberry.type
class ErrorMessage:
    message: str
    status: ResultType

UserResult = Annotated[Union[DbUser, ErrorMessage], strawberry.union("UserResult")]
