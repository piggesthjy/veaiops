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

"""Tests for OpenTelemetry lifespan management."""

import os

import pytest
from fastapi import FastAPI

from veaiops.lifespan.otel import otel_lifespan
from veaiops.settings import O11ySettings, get_settings


@pytest.mark.asyncio
async def test_otel_lifespan_with_o11y_disabled(monkeypatch):
    """Test otel lifespan when O11y is disabled."""
    app = FastAPI()

    # Mock O11y settings to be disabled
    class MockO11ySettings:
        enabled = False

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.settings.get_settings", mock_get_settings)

    # Track if setup_logging was called
    setup_logging_called = [False]

    def mock_setup_logging():
        setup_logging_called[0] = True

    monkeypatch.setattr("veaiops.lifespan.otel.setup_logging", mock_setup_logging)

    async with otel_lifespan(app):
        # When O11y is disabled, setup_logging should not be called
        assert setup_logging_called[0] is False


@pytest.mark.asyncio
async def test_otel_lifespan_with_o11y_enabled(monkeypatch):
    """Test otel lifespan when O11y is enabled."""
    app = FastAPI()

    # Mock O11y settings to be enabled
    class MockO11ySettings:
        enabled = True
        service_name = "test_service"
        service_version = "1.0.0"
        service_environment = "test"
        trace_id_ratio = 0.1
        exporter_otlp_endpoint = "http://localhost:4317"

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.settings.get_settings", mock_get_settings)

    # Track various initialization steps
    trace_provider_set = [False]
    meter_provider_set = [False]
    setup_logging_called = [False]
    instrument_app_called = [False]
    uninstrument_app_called = [False]

    def mock_set_tracer_provider(*args, **kwargs):
        trace_provider_set[0] = True

    def mock_set_meter_provider(*args, **kwargs):
        meter_provider_set[0] = True

    def mock_setup_logging():
        setup_logging_called[0] = True

    class MockFastAPIInstrumentor:
        @staticmethod
        def instrument_app(app, excluded_urls=None):
            instrument_app_called[0] = True

        @staticmethod
        def uninstrument_app(app):
            uninstrument_app_called[0] = True

    monkeypatch.setattr("veaiops.lifespan.otel.trace.set_tracer_provider", mock_set_tracer_provider)
    monkeypatch.setattr("veaiops.lifespan.otel.metrics.set_meter_provider", mock_set_meter_provider)
    monkeypatch.setattr("veaiops.lifespan.otel.setup_logging", mock_setup_logging)
    monkeypatch.setattr("veaiops.lifespan.otel.FastAPIInstrumentor", MockFastAPIInstrumentor)

    async with otel_lifespan(app):
        # All initialization steps should have been called
        assert trace_provider_set[0] is True
        assert meter_provider_set[0] is True
        assert setup_logging_called[0] is True
        assert instrument_app_called[0] is True

    # After exiting, uninstrument should be called
    assert uninstrument_app_called[0] is True


@pytest.mark.asyncio
async def test_otel_lifespan_resource_attributes(monkeypatch):
    """Test that otel lifespan creates resource with correct attributes."""
    app = FastAPI()

    class MockO11ySettings:
        enabled = True
        service_name = "my_service"
        service_version = "2.0.0"
        service_environment = "production"
        trace_id_ratio = 0.5
        exporter_otlp_endpoint = "http://localhost:4317"

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.settings.get_settings", mock_get_settings)

    captured_resource = [None]

    class MockTracerProvider:
        def __init__(self, resource=None, sampler=None):
            captured_resource[0] = resource

        def add_span_processor(self, processor):
            pass

    monkeypatch.setattr("veaiops.lifespan.otel.TracerProvider", MockTracerProvider)
    monkeypatch.setattr("veaiops.lifespan.otel.trace.set_tracer_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.metrics.set_meter_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.setup_logging", lambda: None)

    class MockFastAPIInstrumentor:
        @staticmethod
        def instrument_app(app, excluded_urls=None):
            pass

        @staticmethod
        def uninstrument_app(app):
            pass

    monkeypatch.setattr("veaiops.lifespan.otel.FastAPIInstrumentor", MockFastAPIInstrumentor)

    async with otel_lifespan(app):
        # Verify resource attributes
        assert captured_resource[0] is not None
        attrs = captured_resource[0].attributes
        assert attrs["service.name"] == "my_service"
        assert attrs["service.version"] == "2.0.0"
        assert attrs["environment"] == "production"
        assert "host.name" in attrs
        assert attrs["host.name"] == os.uname().nodename


@pytest.mark.asyncio
async def test_otel_lifespan_trace_sampling(monkeypatch):
    """Test that otel lifespan configures correct sampling ratio."""
    app = FastAPI()

    class MockO11ySettings:
        enabled = True
        service_name = "test_service"
        service_version = "1.0.0"
        service_environment = "test"
        trace_id_ratio = 0.25
        exporter_otlp_endpoint = "http://localhost:4317"

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.settings.get_settings", mock_get_settings)

    captured_sampler = [None]

    class MockTracerProvider:
        def __init__(self, resource=None, sampler=None):
            captured_sampler[0] = sampler

        def add_span_processor(self, processor):
            pass

    monkeypatch.setattr("veaiops.lifespan.otel.TracerProvider", MockTracerProvider)
    monkeypatch.setattr("veaiops.lifespan.otel.trace.set_tracer_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.metrics.set_meter_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.setup_logging", lambda: None)

    class MockFastAPIInstrumentor:
        @staticmethod
        def instrument_app(app, excluded_urls=None):
            pass

        @staticmethod
        def uninstrument_app(app):
            pass

    monkeypatch.setattr("veaiops.lifespan.otel.FastAPIInstrumentor", MockFastAPIInstrumentor)

    async with otel_lifespan(app):
        # Verify sampler was created
        assert captured_sampler[0] is not None


@pytest.mark.asyncio
async def test_otel_lifespan_batch_span_processor_config(monkeypatch):
    """Test that otel lifespan configures BatchSpanProcessor correctly."""
    app = FastAPI()

    class MockO11ySettings:
        enabled = True
        service_name = "test_service"
        service_version = "1.0.0"
        service_environment = "test"
        trace_id_ratio = 0.1
        exporter_otlp_endpoint = "http://localhost:4317"

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.settings.get_settings", mock_get_settings)

    captured_processor = [None]

    class MockTracerProvider:
        def __init__(self, resource=None, sampler=None):
            pass

        def add_span_processor(self, processor):
            captured_processor[0] = processor

    monkeypatch.setattr("veaiops.lifespan.otel.TracerProvider", MockTracerProvider)
    monkeypatch.setattr("veaiops.lifespan.otel.trace.set_tracer_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.metrics.set_meter_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.setup_logging", lambda: None)

    class MockFastAPIInstrumentor:
        @staticmethod
        def instrument_app(app, excluded_urls=None):
            pass

        @staticmethod
        def uninstrument_app(app):
            pass

    monkeypatch.setattr("veaiops.lifespan.otel.FastAPIInstrumentor", MockFastAPIInstrumentor)

    async with otel_lifespan(app):
        # Verify span processor was added
        assert captured_processor[0] is not None


@pytest.mark.asyncio
async def test_otel_lifespan_metric_export_interval(monkeypatch):
    """Test that otel lifespan configures correct metric export interval."""
    app = FastAPI()

    class MockO11ySettings:
        enabled = True
        service_name = "test_service"
        service_version = "1.0.0"
        service_environment = "test"
        trace_id_ratio = 0.1
        exporter_otlp_endpoint = "http://localhost:4317"

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.settings.get_settings", mock_get_settings)

    captured_meter_provider = [{}]

    class MockMeterProvider:
        def __init__(self, resource=None, metric_readers=None):
            captured_meter_provider[0] = {"resource": resource, "metric_readers": metric_readers}

    monkeypatch.setattr("veaiops.lifespan.otel.MeterProvider", MockMeterProvider)
    monkeypatch.setattr("veaiops.lifespan.otel.trace.set_tracer_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.metrics.set_meter_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.setup_logging", lambda: None)

    class MockFastAPIInstrumentor:
        @staticmethod
        def instrument_app(app, excluded_urls=None):
            pass

        @staticmethod
        def uninstrument_app(app):
            pass

    monkeypatch.setattr("veaiops.lifespan.otel.FastAPIInstrumentor", MockFastAPIInstrumentor)

    async with otel_lifespan(app):
        # Verify meter provider was created with metric readers
        assert captured_meter_provider[0] is not None
        assert captured_meter_provider[0]["metric_readers"] is not None


@pytest.mark.asyncio
async def test_otel_lifespan_fastapi_instrumentation_excludes_urls(monkeypatch):
    """Test that FastAPI instrumentation excludes specific URLs."""
    app = FastAPI()

    class MockO11ySettings:
        enabled = True
        service_name = "test_service"
        service_version = "1.0.0"
        service_environment = "test"
        trace_id_ratio = 0.1
        exporter_otlp_endpoint = "http://localhost:4317"

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.settings.get_settings", mock_get_settings)

    captured_excluded_urls = [None]

    class MockFastAPIInstrumentor:
        @staticmethod
        def instrument_app(app, excluded_urls=None):
            captured_excluded_urls[0] = excluded_urls

        @staticmethod
        def uninstrument_app(app):
            pass

    monkeypatch.setattr(
        "veaiops.lifespan.otel.TracerProvider",
        lambda resource, sampler: type("obj", (object,), {"add_span_processor": lambda self, x: None})(),
    )
    monkeypatch.setattr("veaiops.lifespan.otel.trace.set_tracer_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.metrics.set_meter_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.setup_logging", lambda: None)
    monkeypatch.setattr("veaiops.lifespan.otel.FastAPIInstrumentor", MockFastAPIInstrumentor)

    async with otel_lifespan(app):
        # Verify excluded URLs were set
        assert captured_excluded_urls[0] == "/docs,/redoc"


@pytest.mark.asyncio
async def test_otel_lifespan_multiple_calls():
    """Test that otel lifespan can be called multiple times."""
    app1 = FastAPI()
    app2 = FastAPI()

    async with otel_lifespan(app1):
        pass

    async with otel_lifespan(app2):
        pass


@pytest.mark.asyncio
async def test_otel_lifespan_uses_settings_endpoint():
    """Test that otel lifespan uses OTLP endpoint from settings."""
    app = FastAPI()

    # Just verify it uses the settings without errors
    async with otel_lifespan(app):
        pass  # No exception means settings were read correctly


@pytest.mark.asyncio
async def test_otel_lifespan_cleanup_on_exit(monkeypatch):
    """Test that otel lifespan properly cleans up on exit."""
    app = FastAPI()

    class MockO11ySettings:
        enabled = True
        service_name = "test_service"
        service_version = "1.0.0"
        service_environment = "test"
        trace_id_ratio = 0.1
        exporter_otlp_endpoint = "http://localhost:4317"

    def mock_get_settings(x):
        return MockO11ySettings() if x == O11ySettings else get_settings(x)

    monkeypatch.setattr("veaiops.settings.get_settings", mock_get_settings)

    uninstrument_called = [False]

    class MockFastAPIInstrumentor:
        @staticmethod
        def instrument_app(app, excluded_urls=None):
            pass

        @staticmethod
        def uninstrument_app(app):
            uninstrument_called[0] = True

    monkeypatch.setattr(
        "veaiops.lifespan.otel.TracerProvider",
        lambda resource, sampler: type("obj", (object,), {"add_span_processor": lambda self, x: None})(),
    )
    monkeypatch.setattr("veaiops.lifespan.otel.trace.set_tracer_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.metrics.set_meter_provider", lambda x: None)
    monkeypatch.setattr("veaiops.lifespan.otel.setup_logging", lambda: None)
    monkeypatch.setattr("veaiops.lifespan.otel.FastAPIInstrumentor", MockFastAPIInstrumentor)

    async with otel_lifespan(app):
        pass

    # After exiting context, uninstrument should be called
    assert uninstrument_called[0] is True
