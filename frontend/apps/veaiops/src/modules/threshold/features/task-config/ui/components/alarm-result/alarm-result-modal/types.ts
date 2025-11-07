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

import type { SyncAlarmRulesResponse } from 'api-generate';

/**
 * 告警规则操作结果接口
 */
export interface RuleOperationResult {
  action: string;
  rule_id?: string;
  rule_name: string;
  status: string;
  error?: string;
}

/**
 * 告警规则操作分类接口
 */
export interface RuleOperations {
  create: RuleOperationResult[];
  update: RuleOperationResult[];
  delete: RuleOperationResult[];
  failed: RuleOperationResult[];
}

/**
 * 告警结果弹窗属性
 */
export interface AlarmResultModalProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 告警规则同步结果数据 */
  data: SyncAlarmRulesResponse | null;
  /** 关闭弹窗回调 */
  onClose: () => void;
}

/**
 * 格式化后的数据接口
 */
export interface FormattedAlarmResultData extends SyncAlarmRulesResponse {
  rule_operations: RuleOperations;
}
