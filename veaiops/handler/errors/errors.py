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

"""This module defines a set of concrete HTTP exception classes.

These exceptions are designed to be raised within the application and are
automatically handled to produce the appropriate HTTP error responses. Each
exception corresponds to a specific HTTP status code and includes a default
error message.
"""

from fastapi import status

from veaiops.schema.models.base import BUSINESS_CODE_GENERIC_ERROR

from .exception import BaseHTTPExc


# --------------------------------------------------------------------------- #
# Concrete exceptions                                                         #
# --------------------------------------------------------------------------- #
class BadRequestError(BaseHTTPExc):
    """Exception for HTTP 400 Bad Request.

    Raised when a client-sent request is invalid.
    """

    status_code = status.HTTP_400_BAD_REQUEST
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Bad request"


class UnauthorizedError(BaseHTTPExc):
    """Exception for HTTP 401 Unauthorized.

    Raised when authentication credentials are missing or invalid.
    """

    status_code = status.HTTP_401_UNAUTHORIZED
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Unauthorized"


class ForbiddenError(BaseHTTPExc):
    """Exception for HTTP 403 Forbidden.

    Raised when an authenticated user has no permission to perform the action.
    """

    status_code = status.HTTP_403_FORBIDDEN
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Forbidden"


class RecordNotFoundError(BaseHTTPExc):
    """Exception for HTTP 404 Not Found.

    Raised when a requested resource does not exist.
    """

    status_code = status.HTTP_404_NOT_FOUND
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Record not found"


class ConflictError(BaseHTTPExc):
    """Exception for HTTP 409 Conflict.

    Raised when a request conflicts with the current server state (e.g., a duplicate resource).
    """

    status_code = status.HTTP_409_CONFLICT
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Conflict"


class UnprocessableEntityError(BaseHTTPExc):
    """Exception for HTTP 422 Unprocessable Entity.

    Raised when a request is syntactically correct but semantically invalid.
    """

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Unprocessable entity"


class ServiceUnavailableError(BaseHTTPExc):
    """Exception for HTTP 503 Service Unavailable.

    Raised when a service is temporarily unavailable.
    """

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Service unavailable"


class ServerTimeout(BaseHTTPExc):
    """Exception for HTTP 504 Gateway Timeout.

    Raised when the server times out.
    """

    status_code = status.HTTP_504_GATEWAY_TIMEOUT
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Server timeout"


class InternalServerError(BaseHTTPExc):
    """Exception for HTTP 500 Internal Server Error.

    Raised for unexpected server-side errors.
    """

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Internal server error"


class AlreadyExistsError(BaseHTTPExc):
    """Exception for HTTP 409 Conflict.

    Raised when a resource already exists.
    """

    status_code = status.HTTP_409_CONFLICT
    business_code = BUSINESS_CODE_GENERIC_ERROR
    default_message = "Resource already exists"
