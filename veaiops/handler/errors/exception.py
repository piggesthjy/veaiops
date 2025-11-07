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

"""This module defines the base class for custom HTTP exceptions.

It provides a generic structure for creating standardized error responses
throughout the application.
"""

from typing import Dict, Generic, Optional, TypeVar

from fastapi import HTTPException, status
from fastapi.responses import JSONResponse

from veaiops.schema.models.base import BUSINESS_CODE_GENERIC_ERROR, APIResponse

T = TypeVar("T")


# --------------------------------------------------------------------------- #
# Base exception                                                              #
# --------------------------------------------------------------------------- #
class BaseHTTPExc(HTTPException, Generic[T]):
    """Base class for all custom HTTP exceptions.

    This class serves as a foundation for creating specific HTTP exceptions.
    Subclasses should define their own `status_code`, `business_code`, and
    `default_message`.

    Attributes:
        status_code (int): The HTTP status code for the exception.
        business_code (str): A custom business code for client-side handling.
        default_message (str): The default error message if none is provided.
    """

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    business_code: str = BUSINESS_CODE_GENERIC_ERROR
    default_message: str = "Internal server error"

    def __init__(
        self,
        *,
        message: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        data: Optional[T] = None,
    ) -> None:
        """Initializes the BaseHTTPExc instance.

        Args:
            message (Optional[str]): A custom error message. If not provided,
                `default_message` is used.
            headers (Optional[Dict[str, str]]): Custom headers to include in the
                response.
            data (Optional[T]): Optional data to include in the error response body.
        """
        detail = APIResponse[T](code=self.business_code, message=message or self.default_message, data=data)
        super().__init__(status_code=self.status_code, detail=detail.model_dump(), headers=headers)

    def json_response(self) -> JSONResponse:
        """Creates a JSONResponse object from the exception.

        Returns:
            JSONResponse: A FastAPI JSONResponse object representing the error.
        """
        return JSONResponse(
            status_code=self.status_code,
            content=self.detail,
            headers=self.headers,
        )
