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

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import ParentBased, TraceIdRatioBased

from veaiops.utils.log import logger, setup_logging


@asynccontextmanager
async def otel_lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """OpenTelemetry lifespan context manager for FastAPI."""
    from veaiops.settings import O11ySettings, get_settings

    o11_y_settings = get_settings(O11ySettings)
    if o11_y_settings.enabled:
        # 1. Configure service resource (will be passed to Collector)
        resource = Resource(
            attributes={
                "service.name": o11_y_settings.service_name,
                "service.version": o11_y_settings.service_version,
                "environment": o11_y_settings.service_environment,
                "host.name": os.uname().nodename,  # Automatically get the host name
            }
        )

        # 2. Configure sampling strategy (10% sampling is recommended in production)
        sampler = ParentBased(TraceIdRatioBased(o11_y_settings.trace_id_ratio))

        # 3. Initialize tracer (connect to Collector's OTLP gRPC endpoint)
        trace_exporter = OTLPSpanExporter(o11_y_settings.exporter_otlp_endpoint)

        trace_provider = TracerProvider(resource=resource, sampler=sampler)
        trace_provider.add_span_processor(
            BatchSpanProcessor(
                trace_exporter,
                max_queue_size=2048,
                schedule_delay_millis=5000,  # Export in batch every 5 seconds
            )
        )
        trace.set_tracer_provider(trace_provider)

        # 4. Initialize logging system (ensure after Tracer)
        setup_logging()
        logger.info("Telemetry enabled.")

        # 5. Initialize meter (metrics data)
        metric_exporter = OTLPMetricExporter(o11_y_settings.exporter_otlp_endpoint)
        metric_reader = PeriodicExportingMetricReader(
            metric_exporter,
            export_interval_millis=10000,  # Export metrics every 10 seconds
        )
        metric_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
        metrics.set_meter_provider(metric_provider)

        # 6. Auto instrumentation configuration (monitoring for frameworks and libraries)
        # Auto-monitor FastAPI
        FastAPIInstrumentor.instrument_app(
            app=app,
            excluded_urls="/docs,/redoc",  # Exclude non-business endpoints
        )

    yield
    if o11_y_settings.enabled:
        FastAPIInstrumentor.uninstrument_app(app)
        logger.info("shutdown tracer providers or meter providers.")
