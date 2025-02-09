import strawberry

from .auth import get_hashed, admin_guard, user_guard
from ..gql_types import ResultType, ErrorMessage, UserResult

@strawberry.type
class Mutation:
    @strawberry.mutation
    @admin_guard()
    async def create_user(self, info: strawberry.Info, username: str, password: str, is_admin: bool = False) -> UserResult:
        try:
            return await info.context["request"].state.maria.create_user(username, get_hashed(password), is_admin)
        except:
            return ErrorMessage(message="Failed to create user, try another username!", status=ResultType.FAILURE)

@strawberry.type
class Query:
    @strawberry.field
    @user_guard()
    async def user(self, info: strawberry.Info) -> UserResult:
        # ToDo: Add another StrawberryUser for it is useless to return the hased password
        return info.context["user"]