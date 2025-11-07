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

from pymongo import IndexModel

from veaiops.schema.documents.config.base import BaseConfigDocument
from veaiops.schema.types import ChannelType, KBType


class VeKB(BaseConfigDocument):
    """Interest agent configuration document for MongoDB."""

    # Unique identifiers
    bot_id: str  # Bot ID
    channel: ChannelType
    collection_name: str
    kb_type: KBType
    project: str = "default"
    bucket_name: str  # For TOS bucket

    class Settings:
        """Create compound index for idempotence using bot_id + config.category."""

        name = "veaiops__chatops_kb"
        indexes = [IndexModel(["bot_id", "channel", "collection_name", "project"], unique=True)]
