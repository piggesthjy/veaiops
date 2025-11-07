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

from datetime import datetime
from typing import Any, List, Optional, Type, TypeVar

from beanie import Document
from beanie.odm.operators.find.comparison import GTE, LTE

from veaiops.schema.documents.config.base import BaseDocument

T = TypeVar("T", bound=Document)


async def get_item_count(
    model: Type[T], start: Optional[datetime], end: Optional[datetime], condition: List[Any]
) -> int:
    """Get the number of items with condition."""
    conditions: List[Any] = list(condition) if condition else []
    if issubclass(model, BaseDocument):
        if start:
            conditions.append(GTE(model.created_at, start))
        if end:
            conditions.append(LTE(model.created_at, end))
    count = await model.find(*conditions).count()
    return count
