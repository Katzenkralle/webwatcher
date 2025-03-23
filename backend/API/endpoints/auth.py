from typing import Annotated

from fastapi import Depends, APIRouter, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.security.utils import get_authorization_scheme_param

from passlib.context import CryptContext
import bcrypt
# Needet because of: https://github.com/pyca/bcrypt/issues/684
if not hasattr(bcrypt, '__about__'):
    bcrypt.__about__ = type('about', (object,), {'__version__': bcrypt.__version__})

import jwt
import json
from functools import wraps

from backend.db_handler.maria_schemas import DbUser
from backend.API.gql_base_types import Message
from backend.configurator import Config

hash_context = CryptContext(schemes=["bcrypt"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


# ToDo: Move to .env
SECRET_KEY = Config().crypto.secret_key
ALGORITHM = Config().crypto.algorithm

def get_hashed(password: str):
    return hash_context.hash(password)

def generate_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

async def retrieve_oauth_token(request: Request) -> str:
    # 
    # 
    token = request.headers.get("Authorization", "")
    if not token and "oauth2" in request.cookies:
        token = request.cookies.get("oauth2")
    scheme, param = get_authorization_scheme_param(token) 
    # This is a helper function from fastapi that is also called by OAuth2PasswordBearer https://github.com/fastapi/fastapi/blob/master/fastapi/security/oauth2.py
    # Using this method we can get the token from the Authorization header or the cookie
    return param

async def get_current_user_or_none(token: Annotated[str, Depends(retrieve_oauth_token)], request: Request) -> DbUser | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        data = json.loads(payload.get("sub", {}))
        [username, password] = [data.get("user"), data.get("hash")]
        if username is None:
            raise jwt.InvalidTokenError
        user = await request.state.maria.get_user(username)
        if user.password != password:
            # By also checking the password we can invalidate the token with a password change
            raise jwt.InvalidTokenError
    except (jwt.InvalidTokenError, jwt.ExpiredSignatureError):
        return None
    return user

async def get_current_user(user: Annotated[DbUser | None, Depends(get_current_user_or_none)]) -> DbUser:
    # The use of this would block the context generation if the user is None for the gql endpoint
    # rendering them unaccesible for unauthenticated users
    if user is None:
        raise HTTPException(401)
    return user


def user_guard(reject_unauth: any = None, use_http_exception: bool = False):
    if not reject_unauth:
        reject_unauth = Message(message="Unauthorized. You must be loged in to do this.", status="auth_error")
    def user_guard_decorator(fn: callable):
        @wraps(fn)
        async def wrapper(*args, **kwargs):
            info = kwargs.get("info")
            if not info or info.context.get("user") is None:
                return reject_unauth if not use_http_exception else HTTPException(401)
            return await fn(*args, **kwargs)
        return wrapper
    return user_guard_decorator

def admin_guard(reject_unauth: any = None, reject_user: any = None, use_http_exception: bool = False):
    if not reject_user:
        reject_user = Message(message="Insufficient permissions.", status="permission_error")
    def admin_guard_decorator(fn: callable):
        @wraps(fn)
        @user_guard(reject_unauth, use_http_exception)
        async def wrapper(*args, **kwargs):
            info = kwargs.get("info")
            if not info.context.get("user").is_admin:
                return reject_user if not use_http_exception else HTTPException(403)
            return await fn(*args, **kwargs)
        return wrapper
    return admin_guard_decorator


router = APIRouter(prefix="/auth")
@router.post("/token_test")
async def test_token(form_string: str, Request: Request) -> DbUser | None:
    # This is just a test endpoint to see if the token is working
    user = await get_current_user_or_none(token=form_string, request=Request)
    return user

@router.post("/token")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], request: Request):
    # OAuth2 Specific login data to be served as form data with
    # username and password fields (and optionaly scope, grant_type, client_id, client_secret)
    # The endpoint however, must recieve JSON containing the access_token and token_type
    user = await request.state.maria.get_user(form_data.username)
    if not user or not hash_context.verify(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # Password includet to let token be invalidated
    token = generate_token({"sub": json.dumps({"user": user.username, "hash": user.password})})

    return {"access_token": token, "token_type": "bearer"}