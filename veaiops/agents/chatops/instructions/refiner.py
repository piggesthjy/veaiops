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


def load_refiner_instruction() -> AgentDespInst:
    """Load the instruction for the refiner agent."""
    description = "对给定的问题-答案（QA）对进行改进"
    instruction = """
# 任务说明

给定一个从历史对话中提取的问答对（QA），该QA用于回复当前群聊中的问题。你需要先尝试从当前群聊的上文中找到问题的背景，并从群聊下文中找到该问题的答案，并从以下改进选项中选择其中之一：
1. 无操作（pending）：群聊下文中没有任何有效信息或反馈，不进行操作。
2. 保留（keep）：群聊的下文中给出了一致或类似的答案，无需做任何修改。**注意**答案内容；
3. 删除（delete）：用于生成该QA的参考内容与当前群聊内容存在无法解决的冲突，例如过时的参考内容，或不具有泛化性的参考内容，则需要指出存在明显冲突的参考内容id并删除；
4. 修改（modify）：对话内容中给出了更准确的答案，或与参考内容有不同的前置条件，可以根据该对话内容进行修改原QA，解决潜在的冲突，并给出对应的改进建议。同时，如果存在符合“删除”条件的参考内容，请给出对应的参考内容id以删除。


## 问题（Q）提取标准
1. 抽象通用问题：提炼为与具体客户、工单、时间、上下文无关的通用性问题。
    * 反例："这个问题是否已经修复？"（依赖当前工单）
    * 反例："我的账户 'user123' 为什么登不上去了"（依赖具体用户）
    * 正例："忘记密码或无法登录账户怎么办"（通用场景，可复用）
2. 表述清晰、具体：问题应独立、完整，无需依赖对话上下文。
    * 反例："这个参数该怎么用？"（缺少具体的参数信息，缺少上下文）
    * 正例："如何在实例列表接口中使用 region 参数？"（具体、明确）
3. 当给定可参考的问题时，如对话中无答案，可忽略；已有答案则保留。不要求提取出所有参考问题的答案，也不局限于给定的参考问题。
4. 每个问答对应该只包含一个问题，如果一次对话解决多个问题，请分别生成独立的 QA 对象。

## 答案（A）提取标准
1. 提供明确解决方案或指导：答案需具体、可操作，避免模糊表达。
    * 反例："可能是网络问题，建议检查网络连接。"（不确定）
    * 反例："请等待进一步的反馈。" / “请联系相关人员。”（无解决方案）
    * 正例："请在控制台中通过 [设置] > [网络配置] 检查出入方向的安全组配置。"
2. 保持通用性：答案不得包含特定性内容，例如客户、实例、时间、监控数据等。
    * 反例："请联系客户 'user123' 以获取更多信息。"（对于特定于客户的信息，且无明确答案）
    * 反例："扩容是手动操作的，不是HPA的。"（特定于工单操作方式，没有标准答案，不具有通用性）
    * 反例：“已查看网络监控，未见异常。”（仅适用于当前工单）
3. 不包含当前工单的状态、临时方案、以及后续的改进计划：
    * 反例："当前问题已解决/已修复/上线中。"（仅适用于当前工单）
    * 反例："关闭工单"
    * 反例："后续会hotfix修复"（后续的改进计划）
"""  # noqa: E501
    return AgentDespInst(description=description, instruction=instruction)
