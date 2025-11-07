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

"""This module handles the conversion of generic exceptions to HTTP exceptions."""

from typing import Callable, Dict, Type

from beanie.exceptions import DocumentNotFound
from bson.errors import InvalidId
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from pymongo.errors import DuplicateKeyError, NetworkTimeout, ServerSelectionTimeoutError

from veaiops.handler.errors import (
    BadRequestError,
    BaseHTTPExc,
    ConflictError,
    InternalServerError,
    RecordNotFoundError,
    ServerTimeout,
    ServiceUnavailableError,
)
from veaiops.utils.log import logger

# A mapping of exceptions to custom HTTP exceptions.
EXCEPTIONS_MAP: Dict[Type[Exception], Type[BaseHTTPExc]] = {
    DocumentNotFound: RecordNotFoundError,
    DuplicateKeyError: ConflictError,
    NetworkTimeout: ServerTimeout,
    ServerSelectionTimeoutError: ServiceUnavailableError,
    InvalidId: BadRequestError,
    ValidationError: BadRequestError,
    ValueError: BadRequestError,
}


def register_exceptions_handler(app: FastAPI) -> None:
    """Registers exception handlers for the FastAPI application.

    This function iterates over the EXCEPTIONS_MAP and registers a generic
    handler for each specified exception, mapping it to a corresponding
    HTTP exception.

    Args:
        app (FastAPI): The FastAPI application instance.
    """

    def make_handler(exc_cls: type[BaseHTTPExc]) -> Callable:
        """Creates an exception handler for a given HTTP exception class.

        Args:
            exc_cls (type[BaseHTTPExc]): The class of the HTTP exception to be handled.

        Returns:
            Callable: An async function that handles the exception and returns a JSONResponse.
        """

        async def handler(request: Request, exc: Exception) -> JSONResponse:
            """Handles the exception and converts it to a JSON response.

            Args:
                request (Request): The request object.
                exc (Exception): The exception instance.

            Returns:
                JSONResponse: A JSONResponse object with the appropriate status code and error message.
            """
            error_message = str(exc)
            logger.error(f"Catch exception in router {request.url.path}: {error_message}")
            return exc_cls(message=error_message).json_response()

        return handler

    for inner_exc_cls, api_exc_cls in EXCEPTIONS_MAP.items():
        app.exception_handler(inner_exc_cls)(make_handler(api_exc_cls))

    # register default exception handler
    app.exception_handler(Exception)(make_handler(InternalServerError))
