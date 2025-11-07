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

from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field

from veaiops.schema.types import AttributeKey

T = TypeVar("T")

BUSINESS_CODE_SUCCESS = 0
BUSINESS_CODE_GENERIC_ERROR = 1


class APIResponse(BaseModel, Generic[T]):
    """Unified API response model."""

    code: int = Field(default=BUSINESS_CODE_SUCCESS, description="Detailed status Code")
    message: str = Field(default="success", description="Response description")
    data: Optional[T] = Field(default=None, description="Resource data")

    class Config:
        """Example schema for APIResponse with a user data model."""

        json_schema_extra = {
            "example": {
                "code": 0,
                "message": "success",
                "data": {
                    "id": 123,
                    "username": "example",
                    "email": "example@bytedance.com",
                    "createdAt": "2025-01-01T08:00:00Z",
                },
            }
        }


class TimeRange(BaseModel):
    """Time range for filtering."""

    model_config = ConfigDict(populate_by_name=True)
    start_time: int = Field(..., description="Start time")
    end_time: int = Field(..., description="End time")


class SortColumn(BaseModel):
    """Sort column definition."""

    model_config = ConfigDict(populate_by_name=True)
    column: str = Field(..., alias="Column")
    desc: bool = Field(False, alias="Desc")


class PaginationRequest(BaseModel):
    """Pagination request."""

    model_config = ConfigDict(populate_by_name=True)
    page: int = Field(1, alias="Page")
    page_size: int = Field(10, alias="PageSize")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic response model for paginated lists."""

    items: List[T]
    total: int
    page: int
    page_size: int


class PaginatedAPIResponse(BaseModel, Generic[T]):
    """Unified API response model with pagination information."""

    code: int = Field(default=BUSINESS_CODE_SUCCESS, description="Detailed status Code")
    message: str = Field(default="success", description="Response description")
    data: Optional[T] = Field(default=None, description="Resource data")
    limit: int = Field(default=100, description="Maximum number of items returned per page")
    skip: int = Field(default=0, description="Number of items skipped")
    total: int = Field(default=0, description="Total number of items")

    class Config:
        """Example schema for PaginatedAPIResponse with a user data model."""

        json_schema_extra = {
            "example": {
                "code": 0,
                "message": "success",
                "data": [
                    {
                        "id": 123,
                        "username": "example",
                        "email": "example@corp.com",
                        "createdAt": "2025-01-01T08:00:00Z",
                    }
                ],
                "limit": 100,
                "skip": 0,
                "total": 1,
            }
        }


class AttributeItem(BaseModel):
    """Attribute Item."""

    name: AttributeKey = Field(..., description="The name of the attribute.")
    value: str = Field(..., description="The value of the attribute.")


class ToggleActiveRequest(BaseModel):
    """Toggle Active Request. True: active, False: disabled."""

    active: bool
