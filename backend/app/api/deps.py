from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.core.security import decode_token
from app.models.user import User

bearer = HTTPBearer(auto_error=False)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), db: AsyncSession = Depends(get_db)) -> User | None:
    if not creds:
        return None
    data = decode_token(creds.credentials)
    if not data:
        return None
    res = await db.execute(select(User).where(User.id == data['sub']))
    return res.scalar_one_or_none()

async def require_user(user: User | None = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')
    return user

def require_role(*roles):
    async def dep(user: User = Depends(require_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail='Forbidden')
        return user
    return dep
