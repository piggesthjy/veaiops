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

from google.adk.agents.invocation_context import InvocationContext

from veaiops.utils.log import logger


def validate_state_result(ctx: InvocationContext, state_key: str, agent_name: str) -> bool:
    """Validate that a required state result exists."""
    if state_key not in ctx.session.state:
        logger.error(f"[{agent_name}] State key '{state_key}' not found in session")
        return False

    if not ctx.session.state[state_key]:
        logger.error(f"[{agent_name}] State key '{state_key}' is empty or None")
        return False

    return True
