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


from veaiops.agents.chatops.instructions import (
    load_analysis_instruction,
    load_identify_instruction,
    load_interest_instruction,
    load_query_review_instruction,
    load_reactive_instruction,
    load_refiner_instruction,
    load_rewrite_instruction,
    load_summary_instruction,
)
from veaiops.schema.models.chatops import AgentDespInst


def test_load_interest_instruction():
    """Test loading interest agent instruction."""
    interest_description = "检测是否有多个客户受影响"
    positive_examples = "很多客户都反馈问题\n多个用户报告故障"
    negative_examples = "一个客户反馈问题"
    hist_messages = "用户A: 系统崩溃了\n用户B: 我这边也出现问题了"

    result = load_interest_instruction(
        interest_description=interest_description,
        positive_examples=positive_examples,
        negative_examples=negative_examples,
        hist_messages=hist_messages,
    )

    # Should return AgentDespInst
    assert isinstance(result, AgentDespInst)

    # Check description
    assert result.description == "一个用于识别对话内容是否符合特定特征的智能体。"

    # Check that instruction contains all provided parameters
    assert interest_description in result.instruction
    assert positive_examples in result.instruction
    assert negative_examples in result.instruction
    assert hist_messages in result.instruction

    # Check that instruction contains key requirements
    assert "根据给定的规则来进行严格的判断" in result.instruction
    assert "不确定的语气、表达疑问、含糊不清、则认为不符合该特征" in result.instruction
    assert "问题咨询、功能需求、权限申请" in result.instruction


def test_load_interest_instruction_empty_examples():
    """Test interest instruction with empty examples."""
    interest_description = "测试特征"
    positive_examples = ""
    negative_examples = ""
    hist_messages = "空对话"

    result = load_interest_instruction(
        interest_description=interest_description,
        positive_examples=positive_examples,
        negative_examples=negative_examples,
        hist_messages=hist_messages,
    )

    assert isinstance(result, AgentDespInst)
    assert interest_description in result.instruction
    # Empty examples should still be included in instruction
    assert "## 正面示例\n" in result.instruction
    assert "## 负面示例\n" in result.instruction


def test_load_interest_instruction_multiline_content():
    """Test interest instruction with multiline content."""
    interest_description = "多行描述\n包含详细信息\n第三行说明"
    positive_examples = "示例1: 第一个正面例子\n示例2: 第二个正面例子\n示例3: 第三个正面例子"
    negative_examples = "反例1: 第一个负面例子\n反例2: 第二个负面例子"
    hist_messages = "消息1: 内容1\n消息2: 内容2\n消息3: 内容3"

    result = load_interest_instruction(
        interest_description=interest_description,
        positive_examples=positive_examples,
        negative_examples=negative_examples,
        hist_messages=hist_messages,
    )

    # All multiline content should be preserved
    assert interest_description in result.instruction
    assert positive_examples in result.instruction
    assert negative_examples in result.instruction
    assert hist_messages in result.instruction

    # Check that newlines are preserved
    assert "第一个正面例子\n示例2" in result.instruction
    assert "第一个负面例子\n反例2" in result.instruction


def test_load_reactive_instruction():
    """Test loading reactive agent instruction."""
    result = load_reactive_instruction()

    # Should return AgentDespInst
    assert isinstance(result, AgentDespInst)

    # Check description
    assert result.description == "一个多功能的助手，可以回答用户的问题。"

    # Check instruction content
    assert "智能问答助手" in result.instruction
    assert "子智能体和工具" in result.instruction
    assert "短期记忆和长期记忆" in result.instruction
    assert "知识库和外部搜索工具" in result.instruction


def test_load_summary_instruction():
    """Test loading summary agent instruction."""
    result = load_summary_instruction()

    # Should return AgentDespInst
    assert isinstance(result, AgentDespInst)

    # Check description
    assert result.description == "用于回溯群聊历史并且可以总结群聊内容。"

    # Check instruction contains required sections
    assert "当前上下文" in result.instruction
    assert "STATE_CURRENT_TIME" in result.instruction
    assert "STATE_CHAT_ID" in result.instruction


def test_summary_instruction_template_variables():
    """Test that summary instruction contains expected template variables."""
    result = load_summary_instruction()

    # Should contain template variables for state
    assert "{{STATE_CURRENT_TIME}}" in result.instruction
    assert "{{STATE_CHAT_ID}}" in result.instruction

    # These should be the only template variables
    import re

    template_vars = re.findall(r"\{\{[^}]+\}\}", result.instruction)
    expected_vars = ["{{STATE_CURRENT_TIME}}", "{{STATE_CHAT_ID}}"]

    assert len(template_vars) == len(expected_vars)
    for var in expected_vars:
        assert var in template_vars


def test_load_analysis_instruction():
    """Test loading analysis agent instruction."""
    result = load_analysis_instruction()

    # Should return AgentDespInst
    assert isinstance(result, AgentDespInst)

    # Check description
    assert result.description == "根据对话历史、参考资料以及问题上下文，分析问题是否可以被回答，并给出答案。"

    # Check instruction contains key sections
    assert "智能助手" in result.instruction
    assert "使用参考资料的规则" in result.instruction
    assert "禁止事项" in result.instruction
    assert "回复规范" in result.instruction

    # Check template variables
    assert "{{STATE_KB_POINTS}}" in result.instruction
    assert "{{STATE_OVERALL_QUERY}}" in result.instruction

    # Check key rules
    assert "对象一致" in result.instruction
    assert "现象一致" in result.instruction
    assert "条件一致" in result.instruction
    assert "答案明确" in result.instruction

    # Check prohibited items
    assert "不得向提问者索取信息" in result.instruction
    assert "不得包含敏感信息" in result.instruction
    assert "不得建议升级或联系他人" in result.instruction

    # Check instruction is substantial
    assert len(result.instruction) > 500


def test_load_identify_instruction():
    """Test loading identify agent instruction."""
    result = load_identify_instruction()

    # Should return AgentDespInst
    assert isinstance(result, AgentDespInst)

    # Check description
    assert result.description == "识别当前用户的最新问题是否在职责范围内"

    # Check instruction content
    assert "问题识别助手" in result.instruction
    assert "职责范围" in result.instruction
    assert "可以回答咨询类问题" in result.instruction
    assert "可以帮助解释错误信息、异常和常见的排查步骤" in result.instruction

    # Check key rules
    assert "不是一个需要回答的问题" in result.instruction
    assert "不在职责范围内" in result.instruction

    # Check instruction has reasonable length
    assert len(result.instruction) > 100


def test_load_query_review_instruction():
    """Test loading query review agent instruction."""
    result = load_query_review_instruction()

    # Should return AgentDespInst
    assert isinstance(result, AgentDespInst)

    # Check description
    assert result.description == "一个从对话内容中提取问题答案的智能体。"

    # Check instruction contains key sections
    assert "从群聊对话中找到给定问题的答案" in result.instruction
    assert "问题（Q）提取标准" in result.instruction
    assert "答案（A）提取标准" in result.instruction

    # Check Q extraction standards
    assert "抽象通用问题" in result.instruction
    assert "表述清晰、具体" in result.instruction
    assert "问题应独立、完整" in result.instruction

    # Check A extraction standards
    assert "提供明确解决方案或指导" in result.instruction
    assert "保持通用性" in result.instruction
    assert "不包含当前工单的状态" in result.instruction

    # Check examples in standards
    assert "反例" in result.instruction
    assert "正例" in result.instruction

    # Check instruction is substantial
    assert len(result.instruction) > 500


def test_load_refiner_instruction():
    """Test loading refiner agent instruction."""
    result = load_refiner_instruction()

    # Should return AgentDespInst
    assert isinstance(result, AgentDespInst)

    # Check description
    assert result.description == "对给定的问题-答案（QA）对进行改进"

    # Check instruction contains key sections
    assert "任务说明" in result.instruction
    assert "问题（Q）提取标准" in result.instruction
    assert "答案（A）提取标准" in result.instruction

    # Check improvement options
    assert "无操作（pending）" in result.instruction
    assert "保留（keep）" in result.instruction
    assert "删除（delete）" in result.instruction
    assert "修改（modify）" in result.instruction

    # Check task description
    assert "从历史对话中提取的问答对" in result.instruction
    assert "从当前群聊的上文中找到问题的背景" in result.instruction
    assert "从群聊下文中找到该问题的答案" in result.instruction

    # Check Q extraction standards (should be same as query_review)
    assert "抽象通用问题" in result.instruction
    assert "表述清晰、具体" in result.instruction

    # Check A extraction standards
    assert "提供明确解决方案或指导" in result.instruction
    assert "保持通用性" in result.instruction

    # Check instruction is substantial
    assert len(result.instruction) > 800


def test_load_rewrite_instruction():
    """Test loading rewrite agent instruction."""
    result = load_rewrite_instruction()

    # Should return AgentDespInst
    assert isinstance(result, AgentDespInst)

    # Check description
    assert result.description == "将用户对话的当前问题进行改写，生成一个或多个检索子问题的智能体。"

    # Check instruction content
    assert "查询改写助手" in result.instruction
    assert "改写规则" in result.instruction
    assert "例子" in result.instruction

    # Check rewrite rules
    assert "仅改写当前对话中的最新问题" in result.instruction
    assert "删除与搜索无关的内容" in result.instruction
    assert "避免使用非通用信息" in result.instruction
    assert "使用对话历史和任何图像信息" in result.instruction

    # Check examples exist
    assert "例子 1" in result.instruction
    assert "例子 2" in result.instruction
    assert "例子 3" in result.instruction
    assert "原始问题" in result.instruction
    assert "改写后问题" in result.instruction
    assert "解释" in result.instruction

    # Check instruction is substantial
    assert len(result.instruction) > 500


def test_analysis_instruction_template_variables():
    """Test that analysis instruction contains expected template variables."""
    result = load_analysis_instruction()

    # Should contain template variables for state
    assert "{{STATE_KB_POINTS}}" in result.instruction
    assert "{{STATE_OVERALL_QUERY}}" in result.instruction

    # These should be the only template variables in analysis instruction
    import re

    template_vars = re.findall(r"\{\{[^}]+\}\}", result.instruction)
    expected_vars = ["{{STATE_KB_POINTS}}", "{{STATE_OVERALL_QUERY}}"]

    assert len(template_vars) == len(expected_vars)
    for var in expected_vars:
        assert var in template_vars


def test_rewrite_instruction_examples():
    """Test that rewrite instruction contains proper examples."""
    result = load_rewrite_instruction()

    # Check example structure
    examples = ["例子 1", "例子 2", "例子 3"]
    for example in examples:
        assert example in result.instruction

    # Check example content for example 1
    assert "如何使用该参数" in result.instruction
    assert "如何在实例列表请求API中使用region参数" in result.instruction

    # Check example content for example 2
    assert "i-aufbaibzxkasd登陆报错应该如何处理" in result.instruction
    assert "AccessDenied" in result.instruction

    # Check example content for example 3
    assert "temperature参数未生效" in result.instruction
    assert "request id" in result.instruction


def test_query_review_and_refiner_share_qa_standards():
    """Test that query_review and refiner instructions share similar QA standards."""
    query_review_inst = load_query_review_instruction()
    refiner_inst = load_refiner_instruction()

    # Both should have Q and A extraction standards
    assert "问题（Q）提取标准" in query_review_inst.instruction
    assert "问题（Q）提取标准" in refiner_inst.instruction
    assert "答案（A）提取标准" in query_review_inst.instruction
    assert "答案（A）提取标准" in refiner_inst.instruction

    # Both should have similar key standards
    common_q_standards = ["抽象通用问题", "表述清晰、具体"]
    common_a_standards = ["提供明确解决方案或指导", "保持通用性"]

    for standard in common_q_standards:
        assert standard in query_review_inst.instruction
        assert standard in refiner_inst.instruction

    for standard in common_a_standards:
        assert standard in query_review_inst.instruction
        assert standard in refiner_inst.instruction


def test_identify_instruction_scope_definition():
    """Test that identify instruction clearly defines scope."""
    result = load_identify_instruction()

    # Should define what is in scope
    assert "可以回答咨询类问题" in result.instruction
    assert "可以帮助解释错误信息" in result.instruction

    # Should define what is out of scope
    assert "不是一个需要回答的问题" in result.instruction
    assert "不在职责范围内" in result.instruction


def test_analysis_instruction_prohibited_items():
    """Test that analysis instruction lists all prohibited items."""
    result = load_analysis_instruction()

    # Check all prohibited items are listed
    prohibited_items = ["不得向提问者索取信息", "不得包含敏感信息", "不得建议升级或联系他人", "不得使用标题格式"]

    for item in prohibited_items:
        assert item in result.instruction


def test_refiner_instruction_improvement_options():
    """Test that refiner instruction defines all improvement options."""
    result = load_refiner_instruction()

    # Check all improvement options are defined
    improvement_options = [
        "无操作（pending）",
        "保留（keep）",
        "删除（delete）",
        "修改（modify）",
    ]

    for option in improvement_options:
        assert option in result.instruction

    # Each option should have an explanation
    assert "群聊下文中没有任何有效信息或反馈" in result.instruction
    assert "群聊的下文中给出了一致或类似的答案" in result.instruction
    assert "用于生成该QA的参考内容与当前群聊内容存在无法解决的冲突" in result.instruction
    assert "对话内容中给出了更准确的答案" in result.instruction
