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

from jose import jwt

from veaiops.handler.middlewares.auth import ALGORITHM, create_access_token
from veaiops.settings import EncryptionSettings, get_settings


def test_create_access_token_basic():
    """Test create_access_token generates valid JWT token."""
    # Arrange
    data = {"sub": "test_user"}

    # Act
    token = create_access_token(data)

    # Assert - token is generated and is a string
    assert isinstance(token, str)
    assert len(token) > 0

    # Decode and verify token contains expected data
    decoded = jwt.decode(token, get_settings(EncryptionSettings).key, algorithms=[ALGORITHM])
    assert decoded["sub"] == "test_user"
    assert "exp" in decoded


def test_create_access_token_preserves_original_data():
    """Test that create_access_token doesn't modify the original data dict."""
    original_data = {"sub": "test_user", "role": "admin"}
    original_data_copy = original_data.copy()

    create_access_token(original_data)

    # Original data should not be modified
    assert "exp" not in original_data
    assert original_data == original_data_copy


def test_create_access_token_with_additional_claims():
    """Test create_access_token with additional claims in data."""
    # Create token with additional claims
    data = {"sub": "test_user", "role": "admin", "permissions": ["read", "write"]}
    token = create_access_token(data)

    # Verify token is created successfully
    assert isinstance(token, str)
    assert len(token) > 0

    # Verify token can be decoded and contains all claims

    decoded = jwt.decode(token, get_settings(EncryptionSettings).key, algorithms=[ALGORITHM])
    assert decoded["sub"] == "test_user"
    assert decoded["role"] == "admin"
    assert decoded["permissions"] == ["read", "write"]
    assert "exp" in decoded


def test_create_access_token_expiry_is_in_future():
    """Test that token expiry is set in the future."""
    data = {"sub": "test_user"}
    token = create_access_token(data)

    # Decode and verify expiry is in the future

    decoded = jwt.decode(token, get_settings(EncryptionSettings).key, algorithms=[ALGORITHM])
    exp_timestamp = decoded["exp"]

    # Expiry should be greater than current timestamp
    current_timestamp = datetime.now(timezone.utc).timestamp()
    assert exp_timestamp > current_timestamp


def test_create_access_token_custom_expiry():
    """Test create_access_token with custom expiry delta."""
    data = {"sub": "test_user"}
    custom_delta = timedelta(hours=2)
    token = create_access_token(data, expires_delta=custom_delta)

    # Verify token is created
    assert isinstance(token, str)
    assert len(token) > 0

    # Decode and verify expiry is approximately 2 hours in future

    decoded = jwt.decode(token, get_settings(EncryptionSettings).key, algorithms=[ALGORITHM])
    exp_timestamp = decoded["exp"]
    current_timestamp = datetime.now(timezone.utc).timestamp()

    # Expiry should be approximately 2 hours (7200 seconds) in future
    # Allow 10 seconds tolerance for test execution time
    time_diff = exp_timestamp - current_timestamp
    assert 7190 < time_diff < 7210


def test_create_access_token_uses_correct_algorithm():
    """Test that create_access_token uses the configured algorithm."""
    data = {"sub": "test_user"}
    token = create_access_token(data)

    # Decode token to verify it was created with correct algorithm
    # This will raise an error if algorithm doesn't match
    decoded = jwt.decode(token, get_settings(EncryptionSettings).key, algorithms=[ALGORITHM])

    assert "sub" in decoded
    assert decoded["sub"] == "test_user"
    assert "exp" in decoded


def test_create_access_token_multiple_users():
    """Test creating tokens for multiple different users."""
    users = ["user1", "user2", "user3"]
    tokens = []

    for user in users:
        data = {"sub": user}
        token = create_access_token(data)
        tokens.append(token)

    # All tokens should be different
    assert len(set(tokens)) == len(tokens)

    # Each token should decode to correct user
    for i, token in enumerate(tokens):
        decoded = jwt.decode(token, get_settings(EncryptionSettings).key, algorithms=[ALGORITHM])
        assert decoded["sub"] == users[i]
