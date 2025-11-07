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
from typing import Annotated, Optional

from beanie import Document, Indexed
from pydantic import Field


class BaseDocument(Document):
    """Base document model."""

    created_user: Optional[str] = Field(default=None, description="The user who create the config.")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), description="The timestamp when the config created."
    )
    updated_user: Optional[str] = Field(default=None, description="The user who last updated the config.")
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="The timestamp when the config last updated.",
    )

    class Settings:
        """Settings for this document."""

        abstract = True


class BaseConfigDocument(BaseDocument):
    """Base config document model."""

    is_active: Annotated[bool, Indexed()] = True

    class Settings:
        """Settings for this document."""

        abstract = True
