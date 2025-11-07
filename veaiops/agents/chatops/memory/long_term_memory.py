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
from veadk.memory.long_term_memory import LongTermMemory

from veaiops.schema.documents import Bot
from veaiops.utils.crypto import decrypt_secret_value


async def init_ltm(bot: Bot) -> LongTermMemory:
    """Initialize long term memory.

    Args:
        bot (Bot): The bot instance.

    Returns:
        LongTermMemory: The initialized long term memory.
    """
    # Configure long-term memory with Viking backend
    backend_config = {
        "volcengine_access_key": decrypt_secret_value(bot.volc_cfg.ak),
        "volcengine_secret_key": decrypt_secret_value(bot.volc_cfg.sk),
        "index": f"veaiops_reactive_agent_{bot.bot_id}",
        "memory_type": ["sys_event_v1"],
    }

    return LongTermMemory(backend="viking", backend_config=backend_config)
