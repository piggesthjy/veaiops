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

from veaiops.schema.models.chatops import AgentDespInst


def load_identify_instruction() -> AgentDespInst:
    """Load the instruction for the identify agent."""
    description = "识别当前用户的最新问题是否在职责范围内"
    instruction = """你是一个问题识别助手。你的任务是结合对话历史内容，判断当前用户的最新消息内容是否在你的职责范围内。

# 职责范围
1. 你可以回答咨询类问题。
2. 你可以帮助解释错误信息、异常和常见的排查步骤。

**注意**：如果用户的最新消息内容不是一个需要回答的问题，则认为不在职责范围内。
"""
    return AgentDespInst(description=description, instruction=instruction)
