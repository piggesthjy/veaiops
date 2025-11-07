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

"""Tests for default metric templates."""


def test_default_metric_templates_structure_and_types():
    """Test template structure, required fields, and data types."""
    from veaiops.cmd.initial.default_metric_templates import DEFAULT_METRIC_TEMPLATES

    # Verify it's a non-empty list
    assert isinstance(DEFAULT_METRIC_TEMPLATES, list)
    assert 5 <= len(DEFAULT_METRIC_TEMPLATES) <= 100

    required_fields = [
        "metric_type",
        "min_step",
        "max_value",
        "min_value",
        "min_violation",
        "min_violation_ratio",
        "normal_range_start",
        "normal_range_end",
        "missing_value",
        "failure_interval_expectation",
        "display_unit",
        "linear_scale",
        "max_time_gap",
        "min_ts_length",
        "name",
    ]

    seen_keys = set()
    for template in DEFAULT_METRIC_TEMPLATES:
        assert isinstance(template, dict)

        # Check all required fields exist
        for field in required_fields:
            assert field in template, f"Field {field} missing in template {template.get('name', 'unknown')}"

        # Check unique keys (name + metric_type combination)
        key = (template["name"], template["metric_type"])
        assert key not in seen_keys, f"Duplicate template: {key}"
        seen_keys.add(key)

        # Verify string types
        assert isinstance(template["metric_type"], str) and len(template["metric_type"]) > 0
        assert isinstance(template["name"], str) and len(template["name"]) > 0
        assert isinstance(template["missing_value"], str)
        assert isinstance(template["display_unit"], str)

        # Verify Chinese names
        assert any(ord(char) > 127 for char in template["name"]), (
            f"Template name should be in Chinese: {template['name']}"
        )


def test_default_metric_templates_value_ranges():
    """Test that all template values are within valid ranges."""
    from veaiops.cmd.initial.default_metric_templates import DEFAULT_METRIC_TEMPLATES, INFINITY

    for template in DEFAULT_METRIC_TEMPLATES:
        # Positive values
        assert template["min_step"] > 0
        assert template["failure_interval_expectation"] > 0
        assert template["linear_scale"] > 0
        assert template["max_time_gap"] > 0
        assert template["min_ts_length"] > 0

        # Non-negative values
        assert template["min_violation"] >= 0
        assert template["min_violation_ratio"] >= 0

        # Logical constraints
        assert template["max_value"] >= template["min_value"]

        # Normal range should be within min/max bounds (skip infinite bounds)
        if template["max_value"] != INFINITY:
            normal_start = template["normal_range_start"]
            normal_end = template["normal_range_end"]
            min_val = template["min_value"]
            max_val = template["max_value"]

            assert min_val <= normal_start <= max_val, f"normal_range_start out of bounds for {template['name']}"
            assert min_val <= normal_end <= max_val, f"normal_range_end out of bounds for {template['name']}"


def test_specific_templates_and_constants():
    """Test specific template types and constant definitions."""
    from veaiops.cmd.initial import default_metric_templates
    from veaiops.cmd.initial.default_metric_templates import DEFAULT_METRIC_TEMPLATES, INFINITY, NEGATIVE_INFINITY

    # Test INFINITY constants
    assert INFINITY == 9999999999
    assert NEGATIVE_INFINITY == -9999999999
    assert INFINITY > 0
    assert NEGATIVE_INFINITY < 0

    # Test module level definitions
    assert hasattr(default_metric_templates, "DEFAULT_METRIC_TEMPLATES")
    assert hasattr(default_metric_templates, "INFINITY")
    assert hasattr(default_metric_templates, "NEGATIVE_INFINITY")

    found_types = {t["metric_type"]: t for t in DEFAULT_METRIC_TEMPLATES}

    # Test ResourceUtilizationRate100 (0-100%)
    assert "ResourceUtilizationRate100" in found_types
    template = found_types["ResourceUtilizationRate100"]
    assert template["max_value"] == 100
    assert template["min_value"] == 0
    assert template["display_unit"] == "%"

    # Test ResourceUtilizationRate (0-1)
    assert "ResourceUtilizationRate" in found_types
    template = found_types["ResourceUtilizationRate"]
    assert template["max_value"] == 1
    assert template["min_value"] == 0

    # Test SuccessRate100 (0-100%)
    assert "SuccessRate100" in found_types
    template = found_types["SuccessRate100"]
    assert template["max_value"] == 100
    assert template["min_value"] == 0
    assert template["display_unit"] == "%"

    # Test SuccessRate (0-1)
    assert "SuccessRate" in found_types
    template = found_types["SuccessRate"]
    assert template["max_value"] == 1
    assert template["min_value"] == 0
