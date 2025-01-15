from strawberry.fastapi import GraphQLRouter
from fastapi import APIRouter


from . import auth
from . import settings

def get_routes():

    core_routes = APIRouter()
    core_routes.include_router(auth.router)
    core_routes.include_router(settings.router, prefix="/settings")
    return core_routes
