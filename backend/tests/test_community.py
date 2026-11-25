import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_community_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/leaderboard')
        assert r.status_code == 200
        r = await c.get('/badges')
        assert r.status_code == 200
        r = await c.get('/announcements')
        assert r.status_code == 200
        r = await c.get('/challenges')
        assert r.status_code == 200
        r = await c.get('/campaigns')
        assert r.status_code == 200
        r = await c.get('/leaderboard/wards')
        assert r.status_code == 200
        # volunteer registration
        r = await c.post('/volunteers', json={'name': 'Test Volunteer'})
        assert r.status_code == 200
        assert r.json()['status'] == 'pending'
