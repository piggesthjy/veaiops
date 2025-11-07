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


def load_interest_instruction(
    interest_description: str, positive_examples: str, negative_examples: str, hist_messages: str
) -> AgentDespInst:
    """Load the interest agent instruction."""
    description = "一个用于识别对话内容是否符合特定特征的智能体。"
    instruction = f"""你的任务是判断给定的对话内容是否符合如下给定的特征：

## 要求
1. 根据给定的规则来进行严格的判断，且必须有直接证据来做出对应的判断，不要进行假设与推测；
2. 不确定的语气、表达疑问、含糊不清、则认为不符合该特征；
3. 假设、预期、想象中的问题，或担心、预防、避免问题发生，以及操作建议或风险告知，则认为不符合该特征；
4. 问题咨询、功能需求、权限申请、业务流程、开白、限流、进展或结论同步，或已解决的问题，则认为不符合该特征；
5. 未明确表明已发生问题、故障或产生影响，则认为不符合该特征。

## 特征
{interest_description}

## 正面示例
{positive_examples}

## 负面示例
{negative_examples}

# 请分析以下对话内容
{hist_messages}
"""

    return AgentDespInst(description=description, instruction=instruction)
