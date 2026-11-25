import pytest
from app.core.db import init_db


@pytest.fixture(autouse=True, scope='session')
async def _init_test_db():
    await init_db()
