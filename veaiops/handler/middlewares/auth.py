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

from datetime import datetime, timedelta, timezone
from typing import Callable, Optional

from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from veaiops.handler.errors import UnauthorizedError
from veaiops.schema.documents.meta import User
from veaiops.settings import EncryptionSettings, get_settings
from veaiops.utils.crypto import decrypt_secret_value

# Configurations for JWT
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080  # Seven days


class AuthMiddleware(BaseHTTPMiddleware):
    """Authentication middleware for FastAPI."""

    def __init__(self, app, protected_paths=None, whitelist_paths=None):
        super().__init__(app)
        self.protected_paths = protected_paths
        self.whitelist_paths = whitelist_paths or []

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Handle incoming requests and apply authentication.

        Args:
            request (Request): FastAPI request object.
            call_next (Callable): Next middleware or route handler.

        Returns:
            Response: The response object.
        """
        if self._is_whitelisted_path(request.url.path):
            response = await call_next(request)
            return response

        if not self._is_protected_path(request.url.path):
            response = await call_next(request)
            return response

        # Get token from Authorization header
        token = self._extract_token(request)
        if not token:
            raise UnauthorizedError

        # Validate token
        user = await self._authenticate_user(token)
        if not user:
            raise UnauthorizedError(message="Invalid Token")

        # Add user information to the request
        request.state.user = user

        # Continue processing the request
        response = await call_next(request)
        return response

    def _is_whitelisted_path(self, path: str) -> bool:
        """Check if the path is in the whitelist and can bypass authentication.

        Args:
            path (str): Request path.

        Returns:
            bool: True if the path is whitelisted, False otherwise.
        """
        for whitelist_path in self.whitelist_paths:
            if path.startswith(whitelist_path):
                return True
        return False

    def _is_protected_path(self, path: str) -> bool:
        """Check if the path is protected and requires authentication.

        Args:
            path (str): Request path.

        Returns:
            bool: True if the path is protected, False otherwise.
        """
        for protected_path in self.protected_paths or []:
            if path.startswith(protected_path):
                return True  # Requires authentication
        return False  # No authentication required

    def _extract_token(self, request: Request) -> Optional[str]:
        """Extract token from FastAPI Request.

        Args:
            request (Request): FastAPI Request

        Returns:
            Optional[str]: Authorization token in FastAPI Request header
        """
        authorization: str = request.headers.get("Authorization")
        if not authorization:
            return None

        # Check whether it is Bearer token format
        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                return None
            return token
        except ValueError:
            return None

    async def _authenticate_user(self, token: str) -> Optional[User]:
        """Validate user token and return user information.

        Args:
            token (str): The JWT token to validate.

        Returns:
            Optional[User]: User information if token is valid, None otherwise.
        """
        try:
            # Decode the JWT token
            payload = jwt.decode(token, get_settings(EncryptionSettings).key, algorithms=[ALGORITHM])
            if payload is None or not isinstance(payload, dict):
                return None
            username: str = payload.get("sub")
            if username is None:
                return None

            # Look up user from the database
            user = await User.find_one({"username": username})
            if user is None:
                return None

            return user
        except JWTError:
            return None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token.

    Args:
        data (dict): Data to encode in the token.
        expires_delta (Optional[timedelta], optional): Expires delta. Defaults to None.

    Returns:
        str: JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Default expiration is set to 1 day
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, get_settings(EncryptionSettings).key, algorithm=ALGORITHM)
    return encoded_jwt


async def authenticate_user(username: str, password: str) -> Optional[User]:
    """Authenticate a user with the given username and password.

    Args:
        username (str): Username
        password (str): User password

    Returns:
        Optional[User]: Authenticated user object or None if authentication fails.
    """
    user = await User.find_one({"username": username})
    if not user:
        return

    if password != decrypt_secret_value(user.password):
        return
    return user


async def verify_token(token: str) -> Optional[User]:
    """Verify a JWT token and return user information.

    Args:
        token (str): The JWT token to verify.

    Returns:
        Optional[User]: User information if token is valid, None otherwise.
    """
    try:
        payload = jwt.decode(token, get_settings(EncryptionSettings).key, algorithms=[ALGORITHM])
        if payload is None or not isinstance(payload, dict):
            return None
        username: str = payload.get("sub")
        if username is None:
            return None

        user = await User.find_one({"username": username})
        if user is None:
            return None

        return user
    except JWTError:
        return None
