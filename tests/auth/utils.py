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

"""Utility functions for authentication tests."""

from datetime import datetime, timezone

from jose import jwt


def verify_token_structure(token: str) -> bool:
    """Verify that a token has valid JWT structure.

    A valid JWT token should have 3 parts separated by dots:
    - Header
    - Payload
    - Signature

    Args:
        token: JWT token string to verify

    Returns:
        bool: True if token has valid JWT structure, False otherwise
    """
    parts = token.split(".")
    return len(parts) == 3 and all(len(part) > 0 for part in parts)


def get_token_expiry_seconds(token: str, secret_key: str, algorithm: str) -> float:
    """Get the expiry duration of a JWT token in seconds from now.

    Args:
        token: JWT token string
        secret_key: Secret key used to decode the token
        algorithm: Algorithm used to encode the token

    Returns:
        float: Number of seconds until token expires (negative if already expired)
    """
    decoded = jwt.decode(token, secret_key, algorithms=[algorithm])
    exp_timestamp = decoded["exp"]
    current_timestamp = datetime.now(timezone.utc).timestamp()
    return exp_timestamp - current_timestamp
