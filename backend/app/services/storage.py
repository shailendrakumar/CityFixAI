import os
import httpx
from app.core.config import get_settings

settings = get_settings()


async def store_bytes(filename: str, content: bytes, content_type: str | None = None) -> str:
    if settings.supabase_url and settings.supabase_service_role_key:
        url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_storage_bucket}/{filename}"
        headers = {'Authorization': f"Bearer {settings.supabase_service_role_key}", 'apikey': settings.supabase_service_role_key}
        if content_type:
            headers['Content-Type'] = content_type
        async with httpx.AsyncClient() as client:
            r = await client.post(url, content=content, headers=headers)
            r.raise_for_status()
        return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{settings.supabase_storage_bucket}/{filename}"
    os.makedirs(settings.upload_dir, exist_ok=True)
    path = os.path.join(settings.upload_dir, filename)
    with open(path, 'wb') as f:
        f.write(content)
    return f"{settings.public_base_url}/uploads/{filename}"
