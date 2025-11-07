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
import { useMemo } from 'react';
import type {
  FormattedAlarmResultData,
  RuleOperationResult,
  RuleOperations,
} from '../types';

/**
 * 格式化告警结果数据 Hook
 */
export const useFormattedData = (
  data: SyncAlarmRulesResponse | null,
): FormattedAlarmResultData | null => {
  return useMemo(() => {
    if (!data) {
      return null;
    }

    // 处理 rule_operations 数据
    let ruleOperations: RuleOperations = {
      create: [],
      update: [],
      delete: [],
      failed: [],
    };

    // 如果 rule_operations 是数组格式，需要转换
    if (Array.isArray(data.rule_operations)) {
      data.rule_operations.forEach((op: unknown) => {
        const operationData = op as Record<string, unknown>;
        const operation: RuleOperationResult = {
          action: String(operationData.action || 'unknown'),
          rule_id: operationData.rule_id as string | undefined,
          rule_name: String(operationData.rule_name || '未知规则'),
          status: String(operationData.status || 'unknown'),
          error: operationData.error as string | undefined,
        };

        switch (operation.action.toLowerCase()) {
          case 'create':
            ruleOperations.create.push(operation);
            break;
          case 'update':
            ruleOperations.update.push(operation);
            break;
          case 'delete':
            ruleOperations.delete.push(operation);
            break;
          default:
            ruleOperations.failed.push(operation);
        }
      });
    } else if (
      data.rule_operations &&
      typeof data.rule_operations === 'object'
    ) {
      // 如果已经是对象格式，直接使用
      ruleOperations = data.rule_operations as RuleOperations;
    }

    return {
      ...data,
      rule_operations: ruleOperations,
    };
  }, [data]);
};
