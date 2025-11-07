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

from typing import Annotated, Any, Dict

from beanie import Indexed
from pydantic import SecretStr
from pymongo import IndexModel

from veaiops.schema.documents.config.base import BaseConfigDocument


class User(BaseConfigDocument):
    """User information."""

    username: Annotated[str, Indexed()]  # Username
    email: Annotated[str, Indexed()]  # Email address
    password: SecretStr
    is_supervisor: bool = False  # Whether the user is a supervisor

    @classmethod
    def validate_update_fields(cls, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate fields and remove unallowed fields."""
        allowed_fields = {"is_active", "is_supervisor"}
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields and v is not None}
        return filtered_data

    class Settings:
        """Create unique index for username and email."""

        validate_assignment = True
        name = "veaiops__meta_user"
        indexes = [
            IndexModel(["username"], unique=True),
            IndexModel(["email"], unique=True),
        ]
