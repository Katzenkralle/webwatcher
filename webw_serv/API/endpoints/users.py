import strawberry

from typing import Optional
from dataclasses import asdict

from ..endpoints.auth import get_hashed, admin_guard, user_guard, hash_context
from ..gql_base_types import MessageType, Message, UserResult, SessionResult, \
    User as StrawberryUser, SessionList, Session as StrawberrySession


@strawberry.type
class Mutation:
    @strawberry.mutation
    @admin_guard()
    async def create_user(self, info: strawberry.Info, username: str, password: str, is_admin: bool = False) -> UserResult:
        try:
            return await info.context["request"].state.maria.create_user(username, get_hashed(password), is_admin)
        except:
            return Message(message="Failed to create user, try another username!", status=MessageType.DANGER)
        
    @strawberry.mutation
    @user_guard()
    async def logout(self, info: strawberry.Info, session_id: Optional[str] = None, session_name: Optional[str] = None) -> Message:
        if not session_id and not session_name:
            session_id = info.context["session"]
        try:
            await info.context["request"].state.maria.logout_session(session_id, info.context["user"].username, session_name)
            return Message(message="Logged out successfully", status=MessageType.SUCCESS)
        except Exception as e:
            return Message(message=e, status=MessageType.DANGER)
        
    @strawberry.mutation
    @user_guard()
    async def change_password(self, info: strawberry.Info, new_password: str, old_password: str) -> Message:
        if not hash_context.verify(old_password, info.context["user"].password):
            return Message(message="Incorrect old password!", status=MessageType.DANGER)
        try:
            await info.context["request"].state.maria.change_password(info.context["user"].username, get_hashed(new_password))
            return Message(message="Password changed successfully", status=MessageType.SUCCESS)
        except:
            return Message(message="Failed to change password", status=MessageType.DANGER)

@strawberry.type
class Query:
    @strawberry.field
    @user_guard()
    async def user(self, info: strawberry.Info) -> UserResult:
        # ToDo: Add another StrawberryUser for it is useless to return the hased password
        return StrawberryUser(**asdict(info.context["user"]))
    
    @strawberry.field
    @user_guard()
    async def sessions(self, info: strawberry.Info) -> SessionResult:
        try:
            db_sessions = await info.context["request"].state.maria.get_sessions_for_user(info.context["user"].username)
            return SessionList(sessions=[StrawberrySession(**asdict(session)) for session in db_sessions])
        except:
            return Message(message="Failed to get sessions", status=MessageType.DANGER)
