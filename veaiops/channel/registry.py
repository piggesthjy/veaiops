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

from typing import Dict, Type

from veaiops.utils.log import logger

from .base import BaseChannel

# Maintain a mapping of channel names to channel classes
REGISTRY: Dict[str, Type[BaseChannel]] = {}


def register_channel():
    """Register a channel class with the channel registry."""

    def decorator(cls):
        if not issubclass(cls, BaseChannel):
            raise TypeError("Channel class must inherit from BaseChannel")

        if cls.channel in REGISTRY:
            raise ValueError(f"Channel {cls.channel} already registered")
        REGISTRY[cls.channel] = cls
        logger.info(f"Registered channel: {cls.channel}")
        return cls

    return decorator
