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

import pytest
from jose import jwt

from veaiops.handler.middlewares.auth import ALGORITHM, create_access_token, verify_token
from veaiops.settings import EncryptionSettings, get_settings


@pytest.mark.asyncio
async def test_verify_token_valid(test_users):
    """Test verify_token with valid token."""
    user = await test_users("verify_user", "verify@example.com", "verify_pass")

    # Create a valid token
    token = create_access_token(data={"sub": user.username})

    # Verify the token
    verified_user = await verify_token(token)

    assert verified_user is not None
    assert verified_user.username == user.username
    assert verified_user.email == user.email


@pytest.mark.asyncio
async def test_verify_token_invalid_signature(test_users):
    """Test verify_token with invalid signature."""
    user = await test_users("verify_user2", "verify2@example.com", "verify_pass2")

    # Create a token with wrong key
    token = jwt.encode({"sub": user.username}, "wrong_secret_key", algorithm=ALGORITHM)

    # Verify the token
    verified_user = await verify_token(token)

    assert verified_user is None


@pytest.mark.asyncio
async def test_verify_token_expired():
    """Test verify_token with expired token."""
    # Create an expired token
    expired_payload = {"sub": "expired_user", "exp": datetime.now(timezone.utc) - timedelta(hours=1)}
    token = jwt.encode(expired_payload, get_settings(EncryptionSettings).key, algorithm=ALGORITHM)

    # Verify the token
    verified_user = await verify_token(token)

    assert verified_user is None


@pytest.mark.asyncio
async def test_verify_token_no_username():
    """Test verify_token with token missing username."""
    # Create a token without 'sub' claim
    token = create_access_token(data={"user_id": 123, "email": "test@example.com"})

    # Verify the token
    verified_user = await verify_token(token)

    assert verified_user is None


@pytest.mark.asyncio
async def test_verify_token_user_not_found(test_users):
    """Test verify_token when user does not exist in database."""
    # Create a token for non-existent user
    token = create_access_token(data={"sub": "nonexistent_user_12345"})

    # Verify the token
    verified_user = await verify_token(token)

    assert verified_user is None


@pytest.mark.asyncio
async def test_verify_token_malformed():
    """Test verify_token with malformed token."""
    # Use a malformed token
    malformed_token = "this.is.not.a.valid.jwt.token"

    # Verify the token
    verified_user = await verify_token(malformed_token)

    assert verified_user is None


@pytest.mark.asyncio
async def test_verify_token_empty_string():
    """Test verify_token with empty string token."""
    # Verify empty token
    verified_user = await verify_token("")

    assert verified_user is None


@pytest.mark.asyncio
async def test_verify_token_multiple_users(test_users):
    """Test verify_token with multiple users."""
    user1 = await test_users("verify_multi1", "verify_multi1@example.com", "pass1")
    user2 = await test_users("verify_multi2", "verify_multi2@example.com", "pass2")
    user3 = await test_users("verify_multi3", "verify_multi3@example.com", "pass3")

    # Create tokens for each user
    token1 = create_access_token(data={"sub": user1.username})
    token2 = create_access_token(data={"sub": user2.username})
    token3 = create_access_token(data={"sub": user3.username})

    # Verify each token
    verified_user1 = await verify_token(token1)
    verified_user2 = await verify_token(token2)
    verified_user3 = await verify_token(token3)

    assert verified_user1 is not None
    assert verified_user2 is not None
    assert verified_user3 is not None
    assert verified_user1.username == user1.username
    assert verified_user2.username == user2.username
    assert verified_user3.username == user3.username
    assert verified_user1.id != verified_user2.id
    assert verified_user2.id != verified_user3.id


@pytest.mark.asyncio
async def test_verify_token_preserves_user_data(test_users):
    """Test that verify_token returns complete user object."""
    user = await test_users("complete_user", "complete@example.com", "complete_pass", is_supervisor=True)

    # Create a token
    token = create_access_token(data={"sub": user.username})

    # Verify the token
    verified_user = await verify_token(token)

    assert verified_user is not None
    assert verified_user.username == user.username
    assert verified_user.email == user.email
    assert verified_user.is_supervisor == user.is_supervisor
    assert verified_user.id == user.id


@pytest.mark.asyncio
async def test_verify_token_with_additional_claims(test_users):
    """Test verify_token with token containing additional claims."""
    user = await test_users("claims_user", "claims@example.com", "claims_pass")

    # Create a token with additional claims
    token = create_access_token(
        data={"sub": user.username, "role": "admin", "permissions": ["read", "write"], "custom_field": "custom_value"}
    )

    # Verify the token - should still work with additional claims
    verified_user = await verify_token(token)

    assert verified_user is not None
    assert verified_user.username == user.username


@pytest.mark.asyncio
async def test_verify_token_case_sensitive_username(test_users):
    """Test verify_token respects case sensitivity in username."""
    await test_users("CaseSensitive", "case@example.com", "case_pass")

    # Create a token with correct username
    token_correct = create_access_token(data={"sub": "CaseSensitive"})
    verified_correct = await verify_token(token_correct)
    assert verified_correct is not None
    assert verified_correct.username == "CaseSensitive"

    # Create a token with different case username
    token_wrong = create_access_token(data={"sub": "casesensitive"})
    verified_wrong = await verify_token(token_wrong)
    assert verified_wrong is None
