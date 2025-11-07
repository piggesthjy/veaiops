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

from pydantic import BaseModel, Field, SecretStr, computed_field

from veaiops.schema.types import NetworkType
from veaiops.settings import AgentSettings, VolcEngineSettings, get_settings
from veaiops.utils.crypto import EncryptedSecretStr, decrypt_secret_value
from veaiops.utils.log import logger

_agent_settings = get_settings(AgentSettings)
_volc_settings = get_settings(VolcEngineSettings)


class AgentCfg(BaseModel):
    """Agent configuration model."""

    provider: str = Field(default_factory=lambda: _agent_settings.provider)
    name: str = Field(default_factory=lambda: _agent_settings.name)
    embedding_name: str = Field(default_factory=lambda: _agent_settings.embedding_name)
    api_base: str = Field(default_factory=lambda: _agent_settings.api_base)
    api_key: SecretStr = Field(default_factory=lambda: EncryptedSecretStr(_agent_settings.api_key.get_secret_value()))

    async def do_check(self) -> None:
        """Check if api_key is available by dryrun with VeADK api."""
        api_key = decrypt_secret_value(self.api_key)
        if not api_key:
            return None

        from veadk import Agent

        try:
            agent = Agent(
                name="apikey_privilege_check",
                model_name=self.name,
                model_provider=self.provider,
                model_api_base=self.api_base,
                model_api_key=api_key,
            )
            response = await agent.run("echo what i said.")
            logger.info(f"llm agent.run with response: {response}")
        except Exception as e:
            raise ValueError(f"API key check failed: {e}") from e


class VolcCfg(BaseModel):
    """Volc configuration model."""

    ak: SecretStr = Field(default_factory=lambda: EncryptedSecretStr(_volc_settings.ak.get_secret_value()))
    sk: SecretStr = Field(default_factory=lambda: EncryptedSecretStr(_volc_settings.sk.get_secret_value()))
    tos_region: str = Field(default_factory=lambda: _volc_settings.tos_region)
    tos_endpoint: str = Field(default_factory=lambda: _volc_settings.tos_endpoint)
    extra_kb_collections: Optional[List[str]] = Field(default_factory=lambda: _volc_settings.extra_kb_collections)

    @computed_field(description="network_type")
    @property
    def network_type(self) -> str:
        """Auto calculate tos network_type by tos_endpoint."""
        return NetworkType.Internal if ".ivolces.com" in self.tos_endpoint.lower() else NetworkType.Public

    async def do_check(self) -> None:
        """Check if AK/SK is available by dryrun with VolcEngine openApi."""
        ak = decrypt_secret_value(self.ak)
        sk = decrypt_secret_value(self.sk)

        if not ak or not sk:
            return None

        import tos

        try:
            client = tos.TosClientV2(ak, sk, self.tos_endpoint, self.tos_region)
            resp = client.list_buckets()
            logger.info(f"bucket list length: {len(resp.buckets)}")
        except tos.exceptions.TosClientError as e:
            logger.warning(f"fail with client error, message:{e.message}, cause: {e.cause}")
            raise e
        except tos.exceptions.TosServerError as e:
            logger.warning(
                f"fail with server error, code:{e.code}, request id:{e.request_id}, "
                f"message:{e.message}, http code: {e.status_code}"
            )
            raise e
        except Exception as e:
            logger.warning(f"fail with unknown error: {e}")
            raise e


class VolcProviderTag(BaseModel):
    """Volc Tag model."""

    key: str = ""
    value: str = ""


VEAIOPS_TAG = [VolcProviderTag(key="provider", value="veaiops")]
