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
from typing import List, Optional

from cryptography.fernet import Fernet
from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from veaiops.schema.types import ChannelType

# TODO: All configurations should include comments indicating required vs optional and default values


class MongoSettings(BaseSettings):
    """MongoDB configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",  # Use '_' to denote nested settings
        env_prefix="MONGO_",
        extra="allow",  # Allow extra fields in the .env file
    )
    host: str = "localhost"
    user: str = "demo"
    password: SecretStr = SecretStr("demopass")

    @property
    def mongo_uri(self) -> str:
        """MongoDB connection URI.

        Returns:
            str: MongoDB connection URI.
        """
        if self.user and self.password:
            return f"mongodb://{self.user}:{self.password.get_secret_value()}@{self.host}"
        else:
            return f"mongodb://{self.host}"

    @model_validator(mode="after")
    def validate_default_settings(self) -> "MongoSettings":
        """Validate that settings are not empty after initialization."""
        if not self.host:
            raise ValueError("MongoDB settings must be provided and cannot be empty")
        return self


class LogSettings(BaseSettings):
    """Logging configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",  # Use '_' to denote nested settings
        env_prefix="LOG_",
        extra="allow",  # Allow extra fields in the .env file
    )
    level: str = "INFO"
    file: str = "veaiops.log"

    @model_validator(mode="after")
    def validate_default_settings(self) -> "LogSettings":
        """Validate that settings are not empty after initialization."""
        if not self.level:
            raise ValueError("Logging level must be provided and cannot be empty")
        if not self.file:
            raise ValueError("Logging file must be provided and cannot be empty")
        return self


class WebhookSettings(BaseSettings):
    """Webhook configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",  # Use '_' to denote nested settings
        env_prefix="WEBHOOK_",
        extra="allow",  # Allow extra fields in the .env file
    )
    # WEBHOOK_SECRET
    secret: SecretStr = ""
    # Default webhook URL
    url: Optional[str] = Field(default=None, description="Default webhook URL.")
    event_center_url: str
    event_center_external_url: Optional[str] = Field(
        default=None, description="For alarm event to push, not within cluster."
    )
    intelligent_threshold_agent_url: str

    @model_validator(mode="after")
    def validate_default_settings(self) -> "WebhookSettings":
        """Validate that settings are not empty after initialization."""
        if not self.event_center_url:
            raise ValueError("Default webhook URL is empty.")
        if not self.intelligent_threshold_agent_url:
            raise ValueError("Intelligent threshold agent URL is empty.")
        return self


class BotSettings(BaseSettings):
    """Bot configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",  # Use '_' to denote nested settings
        env_prefix="BOT_",
        extra="allow",  # Allow extra fields in the .env file
    )
    id: Optional[str] = None
    channel: ChannelType = ChannelType.Lark
    secret: Optional[SecretStr] = None
    template_id: Optional[str] = None


class O11ySettings(BaseSettings):
    """Config OpenTelemetry settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",  # Use '_' to denote nested settings
        env_prefix="OTEL_",
        extra="allow",
    )

    enabled: bool = False
    service_name: str = "VeAIOps"
    service_version: str = "0.0.1"
    service_environment: str = "production"
    exporter_otlp_endpoint: Optional[str] = None
    # Sampler
    trace_id_ratio: float = 0.1
    # Processor
    schedule_delay_millis: int = 5000
    max_export_batch_size: int = 512
    max_queue_size: int = 2048

    @model_validator(mode="after")
    def validate_default_settings(self) -> "O11ySettings":
        """Validate that settings after initialization."""
        if self.enabled and not self.exporter_otlp_endpoint:
            raise ValueError("When enable Otel, export_otel_endpoint can not be empty")
        return self


class VolcEngineSettings(BaseSettings):
    """VolcEngine configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",  # Use '_' to denote nested settings
        env_prefix="VOLCENGINE_",
        extra="allow",  # Allow extra fields in the .env file
    )
    ak: SecretStr = ""
    sk: SecretStr = ""
    tos_endpoint: str = ""
    tos_region: str = ""
    extra_kb_collections: List[str] = []


class AgentSettings(BaseSettings):
    """LLM configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",  # Use '_' to denote nested settings
        env_prefix="LLM_",
        extra="allow",  # Allow extra fields in the .env file
    )
    provider: str = "openai"  # e.g., openai, azure, volcengine, etc.
    name: str = ""
    embedding_name: str = ""
    api_key: SecretStr = ""
    api_base: str = "https://ark.cn-beijing.volces.com/api/v3"  # e.g., for Azure or custom endpoints

    @model_validator(mode="after")
    def validate_default_settings(self) -> "AgentSettings":
        """Validate that settings are not empty after initialization."""
        if not self.provider:
            raise ValueError("Agent provider must be provided and cannot be empty")
        return self


class EncryptionSettings(BaseSettings):
    """Encryption configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_nested_delimiter="__",  # Use '__' to denote nested settings
        env_prefix="ENCRYPTION_",
        extra="allow",  # Allow extra fields in the .env file
    )
    key: str

    @model_validator(mode="after")
    def validate_default_settings(self) -> "EncryptionSettings":
        """Validate that settings are not empty after initialization."""
        if not self.key:
            raise ValueError("Encryption key must be provided and cannot be empty")
        try:
            Fernet(self.key.encode())
        except ValueError as e:
            raise ValueError("Encryption key must be a valid Fernet key (base64 URL-safe 32-byte)") from e
        return self
