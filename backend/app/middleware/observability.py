import json
import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger('cityfix')


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            'timestamp': self.formatTime(record, self.datefmt),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }
        if hasattr(record, 'request_id'):
            payload['request_id'] = record.request_id
        if record.exc_info:
            payload['exc_info'] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging():
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get('x-request-id') or str(uuid.uuid4())
        request.state.request_id = request_id
        start = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            f'{request.method} {request.url.path} {response.status_code} {duration_ms}ms',
            extra={'request_id': request_id},
        )
        response.headers['x-request-id'] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit_per_minute: int = 120):
        super().__init__(app)
        self.limit = limit_per_minute
        self.buckets: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next):
        if request.url.path == '/health':
            return await call_next(request)
        client = request.client.host if request.client else 'unknown'
        now = time.time()
        window = 60.0
        bucket = self.buckets.setdefault(client, [])
        bucket[:] = [t for t in bucket if now - t < window]
        if len(bucket) >= self.limit:
            return Response('Rate limit exceeded', status_code=429, media_type='text/plain')
        bucket.append(now)
        return await call_next(request)
