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

from fastapi import Depends, Request

from veaiops.handler.errors import ForbiddenError, UnauthorizedError
from veaiops.schema.documents.meta.user import User

__all__ = [
    "get_current_user",
    "get_current_supervisor",
    "get_current_supervisor_not_self",
    "get_current_user_password_only",
]


async def get_current_user(request: Request) -> User:
    """Dependency function to get currently logged-in user."""
    if not hasattr(request.state, "user") or not request.state.user:
        raise UnauthorizedError(message="Not authenticated")
    return request.state.user


async def get_current_supervisor(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency function to verify if current user is administrator."""
    if not current_user.is_supervisor:
        raise ForbiddenError(message="Only administrators can access this resource")
    return current_user


async def get_current_supervisor_not_self(
    request: Request, current_user: User = Depends(get_current_supervisor)
) -> User:
    """Dependency function to verify if current user is administrator but not trying to operate on themselves."""
    user_id = request.path_params.get("user_id")
    if str(current_user.id) == str(user_id):
        raise ForbiddenError(message="Administrators cannot delete themselves")
    return current_user


async def get_current_user_password_only(request: Request, current_user: User = Depends(get_current_user)) -> User:
    """Dependency function to verify if current user is the target user and only updating password."""
    user_id = request.path_params.get("user_id")
    if str(current_user.id) != str(user_id):
        raise ForbiddenError(message="You can only update your own password")
    return current_user
