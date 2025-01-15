import strawberry
from strawberry.fastapi import GraphQLRouter
from typing import Annotated
from enum import Enum
from fastapi import Depends, Request, HTTPException

from .auth import get_hashed, get_current_user_or_none
from db_handler.maria_schemas import DbUser


async def get_context(request:Request, user = Depends(get_current_user_or_none)):
    return {
        "user": user,
        "request": request
    }

@strawberry.enum
class ResultType(Enum):
    SUCCESS = "success"
    AUTH_ERROR = "auth_error"
    FAILURE = "failure"
    NETWORK_ERROR = "network_error"
    WARNING = "warning"
    OK = "ok"
    NOT_OK = "not_ok"
    UNHEALTHY = "unhealthy"
    TIMEOUT = "timeout"
    CATS_AND_DOGS = "cats_and_dogs"

@strawberry.type
class StatusMessage:
    message: str
    status: ResultType


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_user(self, info: strawberry.Info, username: str, password: str, is_admin: bool = False) -> StatusMessage:
        # ToDo: Add Authentication
        if info.context["user"] is None or not info.context["user"].is_admin:
            return StatusMessage(message="Unauthorized", status=ResultType.AUTH_ERROR)
        try:
            await info.context["request"].state.maria.create_user(username, get_hashed(password), is_admin)
        except:
            return StatusMessage(message="Failed to create user", status=ResultType.FAILURE)
        return StatusMessage(message=f"User {username} created", status=ResultType.SUCCESS)

@strawberry.type
class Query:
    @strawberry.field
    async def user(self, info: strawberry.Info) -> DbUser:
        if info.context["user"] is None:
            raise HTTPException(401)
        # ToDo: Add another StrawberryUser for it is useless to return the hased password
        return info.context["user"]
    
    @strawberry.field
    async def status(self) -> StatusMessage:

        return StatusMessage(message="All systems operational", status=ResultType.OK)

schema = strawberry.Schema(query=Query, mutation=Mutation)
router = GraphQLRouter(schema=schema, context_getter=get_context)
