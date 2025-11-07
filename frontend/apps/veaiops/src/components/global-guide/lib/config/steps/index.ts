// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * 向导步骤配置统一导出
 * 按模块拆分，降低单个文件复杂度
 */

import { basicSteps } from './basic';
import { thresholdSteps } from './threshold';
import { systemSteps } from './system';
import { oncallSteps } from './oncall';

/**
 * 合并所有步骤配置
 * 按顺序：基础设施 -> 智能阈值 -> 系统配置 -> Oncall
 */
export const GUIDE_STEPS_CONFIG = [
  ...basicSteps,
  ...thresholdSteps,
  ...systemSteps,
  ...oncallSteps,
];
