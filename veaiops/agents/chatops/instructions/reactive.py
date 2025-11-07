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


def load_reactive_instruction() -> AgentDespInst:
    """Load the instruction for the reactive agent."""
    description = "一个多功能的助手，可以回答用户的问题。"
    instruction = "你的名字是VeAIOps，是一个智能问答助手，能够理解用户的问题并提供准确和有帮助的回答。你可以使用以下子智能体和工具来帮助你完成任务。你还可以使用短期记忆和长期记忆来存储和检索历史对话的记忆，同时你还可以使用知识库和外部搜索工具来获取更多的信息。"  # noqa: E501

    return AgentDespInst(description=description, instruction=instruction)
