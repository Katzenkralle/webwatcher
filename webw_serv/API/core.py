from strawberry.fastapi import GraphQLRouter
from strawberry.tools import merge_types
from strawberry.schema import Schema
from fastapi import APIRouter, Request, Depends

from ..API.endpoints import auth, users, test, scripts
from webw_serv.db_handler.maria_schemas import DbUser

async def get_context(request:Request, 
                      user: dict["user": DbUser, "session": str] | None = Depends(auth.get_current_user_or_none)):
    return {
        "user": user["user"] if user else None,
        "session": user["session"] if user else None,
        "request": request
    }

def get_routes():
    # Registering the endpoints
    gql_querys = merge_types("ComboQuery", (test.Query, users.Query, scripts.Query))
    gql_mutations = merge_types("ComboMutation", (users.Mutation, scripts.Mutation))
    gql_schema = Schema(query=gql_querys, mutation=gql_mutations)
    
    # Creating the GQL router, providing context
    core_gql_router = GraphQLRouter(schema=gql_schema, context_getter=get_context)

    # Creating the core fast-api routes, registering the GQL router and the auth router
    core_routes = APIRouter()
    core_routes.include_router(auth.router)
    core_routes.include_router(core_gql_router, prefix="/gql")

    return core_routes
