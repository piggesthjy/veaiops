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

from datetime import datetime, timezone
from typing import Annotated, Any, Dict

from beanie import Indexed
from pydantic import Field
from pymongo import IndexModel

from veaiops.schema.documents.config.base import BaseConfigDocument


class Product(BaseConfigDocument):
    """Product information."""

    # Product basic information
    product_id: Annotated[str, Indexed()] = Field(..., description="Product ID")  # Product ID
    name: Annotated[str, Indexed()] = Field(..., description="Product name")  # Product name

    # Status
    is_active: bool = True  # Whether the product is active

    # Timestamps
    created_at: datetime = None  # type: ignore
    updated_at: datetime = None  # type: ignore

    def __init__(self, **kwargs):
        # Set default values for created_at and updated_at if not provided
        if "created_at" not in kwargs or kwargs["created_at"] is None:
            kwargs["created_at"] = datetime.now(timezone.utc)
        if "updated_at" not in kwargs or kwargs["updated_at"] is None:
            kwargs["updated_at"] = datetime.now(timezone.utc)
        super().__init__(**kwargs)

    @classmethod
    def validate_update_fields(cls, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate fields and remove unallowed fields."""
        allowed_fields = {"name", "is_active"}
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields and v is not None}
        return filtered_data

    class Settings:
        """Create unique index for product_id and name."""

        validate_assignment = True
        name = "veaiops__product"

        indexes = [
            IndexModel(["product_id"], unique=True),
            IndexModel(["name"]),
        ]
