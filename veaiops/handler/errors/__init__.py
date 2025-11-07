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

"""This package provides a comprehensive framework for handling HTTP exceptions.

It includes a base exception class, a set of concrete exception classes for
common HTTP errors, and a mechanism for converting database-specific exceptions
into standardized HTTP responses.

By importing this package, you gain access to:
- `BaseHTTPExc`: The base class for creating custom HTTP exceptions.
- A range of specific exception classes, such as `BadRequestError`,
  `RecordNotFoundError`, and `InternalServerError`.
- `register_exceptions_handler`: A function to register custom exception
  handlers in a FastAPI application.
"""

from .errors import (
    BadRequestError,
    ConflictError,
    ForbiddenError,
    InternalServerError,
    RecordNotFoundError,
    ServerTimeout,
    ServiceUnavailableError,
    UnauthorizedError,
    UnprocessableEntityError,
)
from .exception import BaseHTTPExc

__all__ = [
    # from .errors
    "BadRequestError",
    "UnauthorizedError",
    "ForbiddenError",
    "RecordNotFoundError",
    "ConflictError",
    "UnprocessableEntityError",
    "ServiceUnavailableError",
    "ServerTimeout",
    "InternalServerError",
    # from .exception
    "BaseHTTPExc",
]
