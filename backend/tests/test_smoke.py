import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/health')
        assert r.status_code == 200
        assert r.json()['status'] == 'ok'

@pytest.mark.asyncio
async def test_create_report():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.post('/reports', json={'title': 'Test pothole', 'description': 'hole', 'lat': 40.7, 'lng': -74.0})
        assert r.status_code == 200
        data = r.json()
        assert data['title'] == 'Test pothole'
        assert data['ai_category'] is not None
