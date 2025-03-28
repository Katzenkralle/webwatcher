import strawberry
from enum import Enum
from typing import Annotated, Union, Optional

from db_handler.maria_schemas import *
from watcher.base import ResultType as BaseResultType
from utility.toolbox import extend_enum

from db_handler import DbUser


@strawberry.type
class Parameter:
    key: str
    value: str

@extend_enum(BaseResultType)
@strawberry.enum
class ResultType(Enum):
    pass

@strawberry.type
class ErrorMessage:
    message: str
    status: ResultType

@strawberry.type
class ScriptValidationResult:
    valid: bool
    available_parameters: list[Parameter]
    supports_static_schema: bool



UserResult = Annotated[Union[DbUser, ErrorMessage], strawberry.union("UserResult")]
