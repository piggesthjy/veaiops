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

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Header
from pydantic import BaseModel

from veaiops.handler.errors import UnauthorizedError
from veaiops.handler.middlewares.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    verify_token,
)
from veaiops.schema.models.base import APIResponse

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    """Login request model."""

    username: str
    password: str


class TokenResponse(BaseModel):
    """Token response model."""

    username: str
    access_token: str


@auth_router.post("/token", response_model=APIResponse[TokenResponse])
async def login_for_access_token(
    login_request: LoginRequest,
) -> APIResponse[TokenResponse]:
    """Get login token for user.

    Args:
        login_request (LoginRequest): The login request containing username and password.

    Returns:
        APIResponse[TokenResponse]: The API response containing the login token.
    """
    user = await authenticate_user(login_request.username, login_request.password)
    if not user or not user.is_active:
        raise UnauthorizedError(message="Invalid username or password.")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    return APIResponse(
        message="Login successful",
        data=TokenResponse(username=user.username, access_token=access_token),
    )


@auth_router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh_access_token(
    authorization: Optional[str] = Header(None),
) -> APIResponse[TokenResponse]:
    """Refresh access token.

    Args:
        authorization (Optional[str]): The Authorization header containing the bearer token.

    Returns:
        APIResponse[TokenResponse]: The API response containing the new access token.
    """
    if not authorization:
        raise UnauthorizedError(message="Authorization header is required.")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise UnauthorizedError(message="Invalid authorization scheme.")
    except ValueError:
        raise UnauthorizedError(message="Invalid authorization header format.")

    # Validate token
    user_info = await verify_token(token)
    if not user_info:
        raise UnauthorizedError(message="Invalid token.")

    # Create a new token valid for 7 days
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(data={"sub": user_info.username}, expires_delta=access_token_expires)

    return APIResponse(
        message="Token refreshed successfully",
        data=TokenResponse(username=user_info.username, access_token=new_access_token),
    )
