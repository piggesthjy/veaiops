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

"""Logging utilities and configuration."""

import importlib
import logging
import os
import sys
import uuid
from typing import Any

from loguru import logger
from opentelemetry import trace
from starlette_context import context
from starlette_context.errors import ContextDoesNotExistError

from veaiops.settings import LogSettings, O11ySettings, get_settings

importlib.import_module("google.adk.models.lite_llm")


third_part_module = ["google_adk.google.adk.models.lite_llm", "opentelemetry"]


class CustomInterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        """Intercepts log messages from the Google ADK.

        Args:
            record (logging.LogRecord): The log record to emit.
        """
        if any(record.name.startswith(module) for module in third_part_module):
            logger.opt(depth=6, exception=record.exc_info).log(record.levelname, record.getMessage())


class HealthzFilter(logging.Filter):
    """Filter out healthz endpoint access logs."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Filter out healthz endpoint access logs.

        Args:
            record: LogRecord

        Returns:
            bool: True if the log record should be processed, False otherwise.
        """
        return "/healthz" not in record.getMessage()


logging.getLogger("uvicorn.access").addFilter(HealthzFilter())

for name in logging.root.manager.loggerDict:
    if any(name.startswith(module) for module in third_part_module):
        lg = logging.getLogger(name)
        lg.setLevel(get_settings(LogSettings).level)
        lg.addHandler(CustomInterceptHandler())


def setup_logging():
    """Set up logging for the application."""
    logger.remove()  # Remove the temporary handler

    o11y_setting = get_settings(O11ySettings)
    log_settings = get_settings(LogSettings)

    level = log_settings.level

    console_formatter = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> "
        "request_id=<blue>{extra[request_id]}</blue> "
        "msg_id=<blue>{extra[msg_id]}</blue> "
        "bot_id=<blue>{extra[bot_id]}</blue> "
        "chat_id=<blue>{extra[chat_id]}</blue> "
        "channel=<blue>{extra[channel]}</blue> "
        "[<level>{level}</level>] <cyan>{name}</cyan>: <level>{message}</level>"
    )
    if o11y_setting.enabled:
        console_formatter = (
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> "
            "request_id=<blue>{extra[request_id]}</blue> "
            "trace_id=<blue>{extra[trace_id]}</blue> "
            "msg_id=<blue>{extra[msg_id]}</blue> "
            "bot_id=<blue>{extra[bot_id]}</blue> "
            "chat_id=<blue>{extra[chat_id]}</blue> "
            "channel=<blue>{extra[channel]}</blue> "
            "[<level>{level}</level>] <cyan>{name}</cyan>: <level>{message}</level>"
        )
    # console sink
    logger.add(
        sink=sys.stderr,
        level=level,
        format=console_formatter,
        enqueue=True,
        filter=MessageContextFilter(),
        colorize=True,
    )

    if log_settings.file:
        # make sure log file exist
        log_dir = os.path.dirname(log_settings.file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)

        file_formatter = (
            "{time:YYYY-MM-DD HH:mm:ss} "
            "request_id={extra[request_id]} "
            "msg_id={extra[msg_id]} "
            "bot_id={extra[bot_id]} "
            "chat_id={extra[chat_id]} "
            "channel={extra[channel]} "
            "[{level}] {name}: {message}"
        )
        if o11y_setting.enabled:
            file_formatter = (
                "{time:YYYY-MM-DD HH:mm:ss} "
                "request_id={extra[request_id]} "
                "trace_id={extra[trace_id]} "
                "msg_id={extra[msg_id]} "
                "bot_id={extra[bot_id]} "
                "chat_id={extra[chat_id]} "
                "channel={extra[channel]} "
                "[{level}] {name}: {message}"
            )

        # file sink
        logger.add(
            log_settings.file,
            rotation="10 MB",
            retention=3,
            level=level,
            format=file_formatter,
            enqueue=True,
            filter=MessageContextFilter(),
            encoding="utf-8",
        )
    logger.info("Logging setup complete.")


class MessageContextFilter:
    """Loguru filter to fetch request_id and message context."""

    def __call__(self, record: Any) -> bool:
        """Enrich log records with request and message context.

        Args:
            record (dict): Log record.

        Returns:
            bool: Whether to log the record.
        """
        try:
            # Get request ID
            record["extra"]["request_id"] = context.get("X-Request-ID", uuid.uuid4().hex)
        except ContextDoesNotExistError:
            # If context doesn't exist (e.g., during startup), use default values
            record["extra"]["request_id"] = uuid.uuid4().hex

        try:
            # Get message context information
            record["extra"]["msg_id"] = context.get("msg_id", "N/A")
        except ContextDoesNotExistError:
            record["extra"]["msg_id"] = "N/A"

        try:
            record["extra"]["bot_id"] = context.get("bot_id", "N/A")
        except ContextDoesNotExistError:
            record["extra"]["bot_id"] = "N/A"

        try:
            record["extra"]["chat_id"] = context.get("chat_id", "N/A")
        except ContextDoesNotExistError:
            record["extra"]["chat_id"] = "N/A"

        try:
            record["extra"]["channel"] = context.get("channel", "N/A")
        except ContextDoesNotExistError:
            record["extra"]["channel"] = "N/A"

        if get_settings(O11ySettings).enabled:
            # Add trace_id from OpenTelemetry
            current_span = trace.get_current_span()
            if current_span.is_recording():
                trace_id = current_span.get_span_context().trace_id
                if trace_id != 0:
                    record["extra"]["trace_id"] = trace.format_trace_id(trace_id)
                else:
                    record["extra"]["trace_id"] = "N/A"
            else:
                record["extra"]["trace_id"] = "N/A"

        return True


# remove default handlers
logger.remove()
# Add a temporary handler for startup logging
logger.add(sys.stderr, level="INFO")
setup_logging()

__all__ = ["logger", "setup_logging"]
