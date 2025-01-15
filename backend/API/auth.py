from typing import Annotated

from fastapi import Depends, APIRouter, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from passlib.context import CryptContext
import bcrypt
if not hasattr(bcrypt, '__about__'):
    bcrypt.__about__ = type('about', (object,), {'__version__': bcrypt.__version__})
from dataclasses import dataclass
import jwt
import json

from db_handler.maria_schemas import DbUser


hash_context = CryptContext(schemes=["bcrypt"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(prefix="/auth")

# ToDo: Move to .env
SECRET_KEY = "51bc0c1562e265a67af236137d6b17f14e5e1c5c580c066dff775b2d53f05d04"
ALGORITHM = "HS256"

def get_hashed(password: str):
    return hash_context.hash(password)

def generate_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

async def get_oauth_or_none(request: Request) -> str | None:
    try:
        return await oauth2_scheme(request)
    except:
        return ""

async def get_current_user_or_none(token: Annotated[str, Depends(get_oauth_or_none)], request: Request) -> DbUser | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = json.loads(payload.get("sub", {})).get("user")
        if username is None:
            raise jwt.InvalidTokenError
        user = await request.state.maria.get_user(username)
    except (jwt.InvalidTokenError, jwt.ExpiredSignatureError):
        return None
    return user

async def get_current_user(user: Annotated[DbUser | None, Depends(get_current_user_or_none)]) -> DbUser:
    if user is None:
        raise HTTPException(401)
    return user




@router.post("/token_test")
async def test_token(user: DbUser = Depends(get_current_user)):
    return user

@router.post("/token")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], request: Request):
    # OAuth2 Specific login data to be served as form data with
    # username and password fields (and optionaly scope, grant_type, client_id, client_secret)
    # The endpoint however, must recieve JSON containing the access_token and token_type
    user = await request.state.maria.get_user(form_data.username)
    if not user:
        return HTTPException(400)
    if not hash_context.verify(form_data.password, user.password):
        return HTTPException(400)

    # Password includet to let token be invalidated
    token = generate_token({"sub": json.dumps({"user": user.username, "hash": user.password})})

    return {"access_token": token, "token_type": "bearer"}

# Access tokenns ar singhed but not encrypted, so the payload can be read by anyone
# Though the payload can be verified to be the same as the one that was signed
# > we do not need to store the token in the database/include a password, we can just verify the token