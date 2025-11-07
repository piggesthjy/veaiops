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


from typing import Optional

from veadk.memory.short_term_memory import ShortTermMemory

from veaiops.utils.log import logger

STM = ShortTermMemory()
STM_SESSION_SVC = STM.session_service


async def init_stm(app_name: str, session_id: str, user_id: str, state: Optional[dict] = None):
    """Update short term memory.

    Args:
        app_name (str): App name
        session_id (str): Session ID
        user_id (str): User ID
        state (dict): State information
    """
    logger.info(f"Creating new session for app={app_name}, session_id={session_id}.")
    await STM_SESSION_SVC.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
        state=state,
    )

    return STM
