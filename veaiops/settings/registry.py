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

from typing import Dict, Type, TypeVar

from pydantic_settings import BaseSettings

T = TypeVar("T", bound=BaseSettings)

_Registry: Dict[Type[BaseSettings], BaseSettings] = {}


def init_settings(*cls_list: Type[T]) -> None:
    """Initialize settings classes.

    Args:
        *cls_list: Settings classes to initialize.

    """
    for cls in cls_list:
        _Registry.setdefault(cls, cls())


def get_settings(cls: Type[T]) -> T:
    """Get settings classes.

    Args:
        cls: Settings class to get.

    Returns:
        Settings instance.

    """
    if cls not in _Registry:
        raise RuntimeError(f"{cls.__name__} not registered")
    return _Registry[cls]  # type: ignore
