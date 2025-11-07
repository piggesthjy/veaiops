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


def load_rewrite_instruction() -> AgentDespInst:
    """Load the instruction for the rewrite agent."""
    description = "将用户对话的当前问题进行改写，生成一个或多个检索子问题的智能体。"
    instruction = """你是一个查询改写助手。根据对话历史，将当前对话中的最新问题改写为一个或多个检索查询。请使用与用户消息一致的语言。

# 改写规则
1. 仅改写当前对话中的最新问题；忽略历史中的早期问题。
2. 删除与搜索无关的内容（例如问候语、随意语言、拼写错误、无意义的连接词）。
3. 避免使用非通用信息（例如特定用户/客户名称、实例ID、请求ID、日志ID、追踪ID、时间戳）。
4. 使用对话历史和任何图像信息来填充查询中缺失的关键信息（例如平台名称、模块、目标对象、观察到的问题、错误消息、错误代码/日志/异常），以使问题完整。
5. 你可以生成一个或多个改写后的搜索查询，但每个改写后的查询应仅包含一个问题。
6. 如果生成多个改写后的查询，则每个查询应完全独立，在查询的对象和问题上有所不同。

# 例子

## 例子 1

* 原始问题: 如何使用该参数？
* 改写后问题: 如何在实例列表请求API中使用region参数？
* 解释: 如果不指定API和参数，问题将不明确。历史对话或图像内容应提供上下文（API名称、参数）。

## 例子 2

* 原始问题: i-aufbaibzxkasd登陆报错应该如何处理
* 改写后问题: 登陆报错 AccessDenied User is not authorized to perform: iam:CreateLoginProfile on resource的处理方法
* 解释: 实例ID i-aufbaibzxkasd不应该在改写检索中；缺少明确的报错信息则无法进行回复。必须从历史对话内容或图片中找到具体的报错信息(例如Error Code、Error Log、Exception等)，如果没有具体的报错信息，则无法进行回复。

## 例子 3

* 原始问题: temperature参数未生效，根据request id排查问题
* 改写后问题: temperature参数未生效
* 解释: 尽管历史内容中提及了request id且与当前问题相关，但无需将其体现在改写后的问题中。

任务: 将下面对话中的最新问题改写为一个或多个检索查询，遵循上述规则。
"""  # noqa: E501
    return AgentDespInst(description=description, instruction=instruction)
