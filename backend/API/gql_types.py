import strawberry
from enum import Enum
from typing import Annotated, Union

from db_handler.maria_schemas import *
from watcher.base import ResultType as BaseResultType
from utility.toolbox import extend_enum

@extend_enum(BaseResultType)
@strawberry.enum
class ResultType(Enum):
    pass

@strawberry.type
class ErrorMessage:
    message: str
    status: ResultType

UserResult = Annotated[Union[DbUser, ErrorMessage], strawberry.union("UserResult")]
