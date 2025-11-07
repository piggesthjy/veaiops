# Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for database lifespan management."""

import pytest
from fastapi import FastAPI
from mongomock_motor import AsyncMongoMockClient

from veaiops.lifespan.db import db_lifespan
from veaiops.settings import MongoSettings, O11ySettings, get_settings


class _MockMongoClientWithClose:
    """Wrapper around AsyncMongoMockClient that provides async close()."""

    def __init__(self, uri):
        self._client = AsyncMongoMockClient(uri)

    def __getattr__(self, name):
        return getattr(self._client, name)

    async def close(self):
        """Mock async close method."""
        pass


@pytest.mark.asyncio
async def test_db_lifespan_basic_initialization(monkeypatch):
    """Test basic database lifespan initialization."""
    app = FastAPI()
    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    async with db_lifespan(app):
        # Verify mongo_client is set on app
        assert hasattr(app, "mongo_client")

        # Verify mongodb_veaiops is set
        assert hasattr(app, "mongodb_veaiops")
        assert getattr(app, "mongodb_veaiops") is not None

    # After exit, client should be closed (we can't directly test this without real connection)


@pytest.mark.asyncio
async def test_db_lifespan_with_o11y_disabled(monkeypatch):
    """Test database lifespan when O11y is disabled."""
    app = FastAPI()

    # Mock O11y settings to be disabled
    class MockO11ySettings:
        enabled = False

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.lifespan.db.get_settings", mock_get_settings)
    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    # Track if PymongoInstrumentor was called
    instrument_called = [False]

    class MockPymongoInstrumentor:
        def instrument(self, capture_statement=True):
            instrument_called[0] = True
            return self

    monkeypatch.setattr("veaiops.lifespan.db.PymongoInstrumentor", MockPymongoInstrumentor)

    async with db_lifespan(app):
        # PymongoInstrumentor should not be called when O11y is disabled
        assert instrument_called[0] is False
        assert hasattr(app, "mongo_client")


@pytest.mark.asyncio
async def test_db_lifespan_with_o11y_enabled(monkeypatch):
    """Test database lifespan when O11y is enabled."""
    app = FastAPI()

    # Mock O11y settings to be enabled
    class MockO11ySettings:
        enabled = True

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.lifespan.db.get_settings", mock_get_settings)
    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    # Track if PymongoInstrumentor was called
    instrument_called = [False]

    class MockPymongoInstrumentor:
        def instrument(self, capture_statement=True):
            instrument_called[0] = True
            return self

    monkeypatch.setattr("veaiops.lifespan.db.PymongoInstrumentor", MockPymongoInstrumentor)

    async with db_lifespan(app):
        # PymongoInstrumentor should be called when O11y is enabled
        assert instrument_called[0] is True
        assert hasattr(app, "mongo_client")


@pytest.mark.asyncio
async def test_db_lifespan_initializes_beanie(monkeypatch):
    """Test that db lifespan properly initializes Beanie."""
    app = FastAPI()
    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    async with db_lifespan(app):
        # Verify we can access the database
        mongodb_veaiops = getattr(app, "mongodb_veaiops")
        assert mongodb_veaiops is not None

        # Try to perform a simple database operation
        # Since we're using mongomock from conftest, this should work
        collection = mongodb_veaiops["test_collection"]
        await collection.insert_one({"test": "data"})
        result = await collection.find_one({"test": "data"})
        assert result is not None
        assert result["test"] == "data"


@pytest.mark.asyncio
async def test_db_lifespan_cleanup_closes_client(monkeypatch):
    """Test that db lifespan properly closes client on exit."""
    app = FastAPI()
    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    close_called = [False]

    async def mock_close():
        close_called[0] = True

    async with db_lifespan(app):
        # Replace close method with mock
        mongo_client = getattr(app, "mongo_client")
        mongo_client.close = mock_close

    # After exiting context, close should have been called
    assert close_called[0] is True


@pytest.mark.asyncio
async def test_db_lifespan_sets_correct_database_name(monkeypatch):
    """Test that db lifespan sets correct database name."""
    app = FastAPI()
    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    async with db_lifespan(app):
        # The database should be named 'veaiops'
        mongodb_veaiops = getattr(app, "mongodb_veaiops")
        assert mongodb_veaiops.name == "veaiops"


@pytest.mark.asyncio
async def test_db_lifespan_uses_mongo_settings(monkeypatch):
    """Test that db lifespan uses correct mongo settings."""
    app = FastAPI()
    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    get_settings(MongoSettings)

    async with db_lifespan(app):
        # Verify the client was created (we can't easily verify the URI without exposing it)
        assert hasattr(app, "mongo_client")
        assert getattr(app, "mongo_client", None) is not None


@pytest.mark.asyncio
async def test_db_lifespan_exception_during_initialization(monkeypatch):
    """Test db lifespan handles exceptions during initialization."""
    app = FastAPI()
    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    # Mock init_beanie to raise an exception
    async def mock_init_beanie(*args, **kwargs):
        raise Exception("Database initialization failed")

    monkeypatch.setattr("veaiops.lifespan.db.init_beanie", mock_init_beanie)

    with pytest.raises(Exception, match="Database initialization failed"):
        async with db_lifespan(app):
            pass


@pytest.mark.asyncio
async def test_db_lifespan_can_query_documents(monkeypatch):
    """Test that documents can be queried after initialization."""
    from veaiops.schema.documents import Bot, Chat

    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    app = FastAPI()

    async with db_lifespan(app):
        # Try to query documents (should work with mongomock)
        bots = await Bot.find().to_list()
        assert isinstance(bots, list)

        chats = await Chat.find().to_list()
        assert isinstance(chats, list)


@pytest.mark.asyncio
async def test_db_lifespan_multiple_contexts(monkeypatch):
    """Test that db lifespan can be used multiple times."""
    app1 = FastAPI()
    app2 = FastAPI()
    monkeypatch.setattr("veaiops.lifespan.db.AsyncMongoClient", _MockMongoClientWithClose)

    async with db_lifespan(app1):
        assert hasattr(app1, "mongo_client")

    async with db_lifespan(app2):
        assert hasattr(app2, "mongo_client")
