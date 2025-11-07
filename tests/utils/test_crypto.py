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

"""Tests for encryption utilities."""

import pytest
from cryptography.fernet import Fernet
from pydantic import SecretStr

from veaiops.settings import EncryptionSettings, get_settings
from veaiops.utils.crypto import EncryptedSecretStr, decrypt_secret_value


def test_encrypted_secret_str_basic_operations(test_key_context):
    """Test basic encryption, decryption, and value handling."""
    test_cases = [
        "test_secret_value",
        "",  # empty string
        "!@#$%^&*()_+-=[]{}|;:',.<>?/~`",  # special characters
        "你好世界🌍",  # unicode
        "a" * 10000,  # long string
    ]

    for original_value in test_cases:
        # Test init and decrypt
        encrypted_secret = EncryptedSecretStr(original_value)
        assert encrypted_secret.get_secret_value() != original_value
        assert encrypted_secret.get_decrypted_value() == original_value

        # Test from_encrypted_value
        encrypted_value = encrypted_secret.get_encrypted_value()
        new_secret = EncryptedSecretStr.from_encrypted_value(encrypted_value)
        assert new_secret.get_decrypted_value() == original_value

        # Test decrypt_secret_value function
        assert decrypt_secret_value(encrypted_secret) == original_value

    # Test multiple instances produce different encrypted values but same decrypted value
    secret1 = EncryptedSecretStr("same_value")
    secret2 = EncryptedSecretStr("same_value")
    assert secret1.get_decrypted_value() == secret2.get_decrypted_value()


def test_encrypted_secret_str_cipher_singleton(test_key_context):
    """Test cipher singleton behavior and reuse."""
    # Test singleton pattern
    cipher1 = EncryptedSecretStr._get_cipher()
    cipher2 = EncryptedSecretStr._get_cipher()
    assert cipher1 is cipher2

    # Test cipher reuse across instances
    first_secret = EncryptedSecretStr("value1")
    first_cipher = EncryptedSecretStr._cipher
    second_secret = EncryptedSecretStr("value2")
    second_cipher = EncryptedSecretStr._cipher

    assert first_cipher is second_cipher
    assert first_secret.get_decrypted_value() == "value1"
    assert second_secret.get_decrypted_value() == "value2"

    # Test cipher initialization with valid key
    test_key_bytes = Fernet.generate_key()
    original_key = get_settings(EncryptionSettings).key
    get_settings(EncryptionSettings).key = test_key_bytes.decode()

    try:
        EncryptedSecretStr._cipher = None
        cipher = EncryptedSecretStr._get_cipher()
        assert cipher is not None
        assert isinstance(cipher, Fernet)
    finally:
        get_settings(EncryptionSettings).key = original_key
        EncryptedSecretStr._cipher = None


def test_encrypted_secret_str_error_handling():
    """Test error handling for invalid inputs."""
    original_key = get_settings(EncryptionSettings).key

    try:
        # Test invalid encryption key
        get_settings(EncryptionSettings).key = "invalid_key"
        EncryptedSecretStr._cipher = None
        with pytest.raises(RuntimeError, match="Invalid ENCRYPTION_KEY"):
            EncryptedSecretStr("test_value")

        # Restore key for remaining tests
        get_settings(EncryptionSettings).key = original_key
        EncryptedSecretStr._cipher = None

        # Test decrypt_secret_value with invalid inputs
        with pytest.raises(ValueError, match="encrypted_value must be SecretStr"):
            decrypt_secret_value(None)  # type: ignore[arg-type]

        with pytest.raises(ValueError, match="encrypted_value must be SecretStr"):
            decrypt_secret_value("not_a_secret_str")  # type: ignore[arg-type]

        # Test with invalid encrypted content
        invalid_secret = SecretStr("invalid_encrypted_content")
        with pytest.raises(ValueError, match="invalid encrypted secret format"):
            decrypt_secret_value(invalid_secret)

        # Test with regular SecretStr (not encrypted)
        regular_secret = SecretStr("plain_text_value")
        with pytest.raises(ValueError, match="invalid encrypted secret format"):
            decrypt_secret_value(regular_secret)

    finally:
        get_settings(EncryptionSettings).key = original_key
        EncryptedSecretStr._cipher = None
