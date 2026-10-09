from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pip._internal.utils import datetime
from pydantic import BaseModel
from typing import Optional, Dict, List
from database import users
from passlib.context import CryptContext
from fastapi_login import LoginManager
import os
from dotenv import load_dotenv

class Notification(BaseModel):
    author              : str
    description         : str

class User(BaseModel):
    name                : str
    username            : str
    email               : str
    birthday            : str
    friends             : List[str]
    notifications       : List[Notification]

class UserBD(User):
    hashed_password : str

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ACCESS_TOKEN_EXPIRE_MINUTES = 60
manager = LoginManager(secret = SECRET_KEY,token_url="/login",use_cookie=True)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
manager.cookie_name = "auth"

@manager.user_loader()
def get_user_from_db(username : str):
    if username in users.keys():
        return UserDB(**users[username])

def authenticate_user(username: str, password: str):
    user = get_user_from_db(username)
    if not user:
        return None
    if not verify_password(plain_password= password, hashed_password= user.hashed_password):
        return None
    return user


def get_hashed_password(plain_password: str):
    return pwd_context.hash(plain_password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)






app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
def root(request: Request):
    return templates.TemplateResponse(request, "index.html")



