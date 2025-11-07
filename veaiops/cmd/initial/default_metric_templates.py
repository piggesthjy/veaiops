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

"""Default metric templates data."""

INFINITY = 9999999999
NEGATIVE_INFINITY = -9999999999

DEFAULT_METRIC_TEMPLATES = [
    {
        "metric_type": "ResourceUtilizationRate100",
        "min_step": 0.001,
        "max_value": 100,
        "min_value": 0,
        "min_violation": 0,
        "min_violation_ratio": 0,
        "normal_range_start": 0,
        "normal_range_end": 70,
        "missing_value": "0",
        "failure_interval_expectation": 300,
        "display_unit": "%",
        "linear_scale": 1,
        "max_time_gap": 600,
        "min_ts_length": 2880,
        "name": "资源使用率百分比",
    },
    {
        "metric_type": "ResourceUtilizationRate",
        "min_step": 0.00001,
        "max_value": 1,
        "min_value": 0,
        "min_violation": 0,
        "min_violation_ratio": 0,
        "normal_range_start": 0,
        "normal_range_end": 0.7,
        "missing_value": "0",
        "failure_interval_expectation": 300,
        "display_unit": "",
        "linear_scale": 1,
        "max_time_gap": 600,
        "min_ts_length": 2880,
        "name": "资源使用率(范围0-1)",
    },
    {
        "metric_type": "ErrorRate100",
        "min_step": 0.01,
        "max_value": 100,
        "min_value": 0,
        "min_violation": 0,
        "min_violation_ratio": 0,
        "normal_range_start": 0,
        "normal_range_end": 10,
        "missing_value": "0",
        "failure_interval_expectation": 300,
        "display_unit": "%",
        "linear_scale": 1,
        "max_time_gap": 600,
        "min_ts_length": 2880,
        "name": "错误率百分比",
    },
    {
        "metric_type": "SuccessRate100",
        "min_step": 0.01,
        "max_value": 100,
        "min_value": 0,
        "min_violation": 0,
        "min_violation_ratio": 0,
        "normal_range_start": 95,
        "normal_range_end": 0,
        "missing_value": "100",
        "failure_interval_expectation": 300,
        "display_unit": "%",
        "linear_scale": 1,
        "max_time_gap": 600,
        "min_ts_length": 2880,
        "name": "成功率百分比",
    },
    {
        "metric_type": "SuccessRate",
        "min_step": 0.0001,
        "max_value": 1,
        "min_value": 0,
        "min_violation": 0,
        "min_violation_ratio": 0,
        "normal_range_start": 0.95,
        "normal_range_end": 0,
        "missing_value": "0",
        "failure_interval_expectation": 300,
        "display_unit": "",
        "linear_scale": 1,
        "max_time_gap": 600,
        "min_ts_length": 2880,
        "name": "成功率",
    },
]
