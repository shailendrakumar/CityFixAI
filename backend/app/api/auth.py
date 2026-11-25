from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas import SignupRequest, LoginRequest, TokenResponse, UserOut
from app.api.deps import require_user
import uuid

router = APIRouter(prefix='/auth', tags=['auth'])

@router.post('/signup', response_model=TokenResponse)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == body.email))
    if res.scalar_one_or_none():
        raise HTTPException(400, 'Email already registered')
    u = User(id=str(uuid.uuid4()), email=body.email, password_hash=hash_password(body.password), display_name=body.display_name or 'Citizen', role='citizen', is_demo=False)
    db.add(u); await db.commit(); await db.refresh(u)
    token = create_access_token(u.id, u.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(u))

@router.post('/login', response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == body.email))
    u = res.scalar_one_or_none()
    if not u or not u.password_hash or not verify_password(body.password, u.password_hash):
        raise HTTPException(401, 'Invalid credentials')
    token = create_access_token(u.id, u.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(u))

@router.get('/me', response_model=UserOut)
async def me(user=Depends(require_user)):
    return UserOut.model_validate(user)
