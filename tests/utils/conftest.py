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

"""Test fixtures for utils module tests."""

import pytest
from cryptography.fernet import Fernet

from veaiops.settings import EncryptionSettings, get_settings
from veaiops.utils.crypto import EncryptedSecretStr

# Note: Common fixtures (mock_api_calls, test_bot, test_chat, test_messages)
# are now defined in the root tests/conftest.py and automatically available


@pytest.fixture
def test_key_context():
    """Fixture to set up a test encryption key and cleanup after test.

    This fixture:
    - Generates a new valid Fernet key for testing
    - Sets it as the encryption key
    - Clears the cipher singleton to ensure fresh state
    - Restores original key and clears singleton after test
    """
    # Generate a valid Fernet key for testing
    test_key = Fernet.generate_key().decode()

    # Save original key
    original_key = get_settings(EncryptionSettings).key

    # Set test key
    get_settings(EncryptionSettings).key = test_key

    # Clear the singleton instance to ensure we use the new key
    EncryptedSecretStr._cipher = None

    yield test_key

    # Restore the original key
    get_settings(EncryptionSettings).key = original_key

    # Clear the singleton instance
    EncryptedSecretStr._cipher = None
