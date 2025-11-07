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
 * 阿里云指标选择业务逻辑 Hook
 * @description 处理指标选择的核心业务逻辑
 */

import { useCallback } from 'react';
import type { AliyunMetric, WizardActions } from '../../../../types';

export const useAliyunMetricSelection = (actions: WizardActions) => {
  // 处理指标选择，自动设置所有维度为选中状态（默认全选）
  const handleMetricSelect = useCallback(
    (metric: AliyunMetric) => {
      actions.setSelectedAliyunMetric(metric);
      // 默认选中所有维度
      if (metric.dimensionKeys && metric.dimensionKeys.length > 0) {
        actions.setSelectedGroupBy(metric.dimensionKeys);
      } else {
        actions.setSelectedGroupBy([]);
      }
    },
    [actions],
  );

  return {
    handleMetricSelect,
  };
};
