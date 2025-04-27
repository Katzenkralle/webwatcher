from strawberry.fastapi import GraphQLRouter
from strawberry.tools import merge_types
from strawberry.schema import Schema
from fastapi import APIRouter, Request, Depends

from .endpoints import auth, users, test, scripts, jobs
from webw_serv.db_handler.maria_schemas import DbUser

async def get_context(request:Request, 
                      user: dict["user": DbUser, "session": str] | None = Depends(auth.get_current_user_or_none)):
    return {
        "user": user["user"] if user else None,
        "session": user["session"] if user else None,
        "request": request
    }

def get_routes(is_dev: bool = False):
    # Registering the endpoints
    gql_querys = merge_types("ComboQuery", (test.Query, users.Query, scripts.Query, jobs.Query))
    gql_mutations = merge_types("ComboMutation", (users.Mutation, scripts.Mutation, jobs.Mutation))
    gql_schema = Schema(query=gql_querys, mutation=gql_mutations)
    
    # Creating the GQL router, providing context
    gql_ide = None
    if is_dev:
        gql_ide = 'graphiql'
    core_gql_router = GraphQLRouter(schema=gql_schema, context_getter=get_context, graphql_ide=gql_ide)

    # Creating the core fast-api routes, registering the GQL router and the auth router
    core_routes = APIRouter()
    core_routes.include_router(auth.router)
    core_routes.include_router(core_gql_router, prefix="/gql")

    return core_routes
