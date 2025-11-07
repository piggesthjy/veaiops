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


from typing import ClassVar

from cryptography.fernet import Fernet
from pydantic import SecretStr

from veaiops.settings import EncryptionSettings, get_settings


class EncryptedSecretStr(SecretStr):
    """Extended SecretStr with automatic encryption and decryption support (Singleton cipher)."""

    # Class-level singleton Fernet instance
    _cipher: ClassVar[Fernet | None] = None

    @classmethod
    def _get_cipher(cls) -> Fernet:
        """Get singleton Fernet instance (lazy loading)."""
        if cls._cipher is None:
            key = get_settings(EncryptionSettings).key
            if isinstance(key, str):
                key = key.encode()

            try:
                cls._cipher = Fernet(key)
            except ValueError as e:
                raise RuntimeError("Invalid ENCRYPTION_KEY: must be a Fernet base64 URL-safe 32-byte key") from e

        return cls._cipher

    def __init__(self, secret_value: str) -> None:
        """Create an instance from the original plaintext (automatic encryption)."""
        cipher = self._get_cipher()
        encrypted_value = cipher.encrypt(secret_value.encode()).decode()
        super().__init__(encrypted_value)

    def get_decrypted_value(self) -> str:
        """Get the original value after decryption."""
        cipher = self._get_cipher()
        decrypted_bytes = cipher.decrypt(self._secret_value.encode())
        return decrypted_bytes.decode()

    def get_encrypted_value(self) -> str:
        """Get the encrypted value."""
        return self._secret_value

    @classmethod
    def from_encrypted_value(cls, encrypted_value: str) -> "EncryptedSecretStr":
        """Create an instance from an already encrypted value."""
        instance = cls.__new__(cls)
        instance._secret_value = encrypted_value
        return instance


def decrypt_secret_value(encrypted_value: SecretStr) -> str:
    """Decrypt an encrypted secret value using EncryptedSecretStr.

    Args:
        encrypted_value (SecretStr): The encrypted secret value.

    Returns:
        str: The decrypted value.
    """
    if encrypted_value is None or not isinstance(encrypted_value, SecretStr):
        raise ValueError("encrypted_value must be SecretStr")
    try:
        return EncryptedSecretStr.from_encrypted_value(encrypted_value.get_secret_value()).get_decrypted_value()
    except Exception as e:
        raise ValueError(f"invalid encrypted secret format: {type(e).__name__}") from e
