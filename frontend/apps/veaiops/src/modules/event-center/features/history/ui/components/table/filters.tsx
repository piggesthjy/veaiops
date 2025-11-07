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
 * 历史事件表格筛选配置
 *
 * 将筛选配置逻辑单独抽象出来，提高代码可维护性
 */

import type { HistoryFilters } from '@ec/history';
import type { FieldItem, HandleFilterProps } from '@veaiops/components';
import {
  AGENT_OPTIONS_EVENT_CENTER_HISTORY,
  EVENT_LEVEL_OPTIONS,
} from '@veaiops/constants';
import type { EventLevel } from 'api-generate';
import { useCallback } from 'react';

/**
 * 历史事件表格筛选配置 Hook
 * 负责定义所有筛选条件和表单
 */
export const useHistoryTableFilters = () => {
  return useCallback(
    (props: HandleFilterProps<HistoryFilters>): FieldItem[] => [
      {
        field: 'agent_type',
        label: '智能体',
        type: 'Select',
        componentProps: {
          placeholder: '请选择智能体',
          value: props.query?.agent_type,
          mode: 'multiple',
          maxTagCount: 2,
          options: AGENT_OPTIONS_EVENT_CENTER_HISTORY,
          onChange: (value: string[]) => {
            props.handleChange({ key: 'agent_type', value });
          },
        },
      },
      {
        field: 'event_level',
        label: '事件级别',
        type: 'Select',
        componentProps: {
          placeholder: '请选择事件级别',
          value: props.query?.event_level,
          allowClear: true,
          options: EVENT_LEVEL_OPTIONS,
          onChange: (value: EventLevel) => {
            props.handleChange({ key: 'event_level', value });
          },
        },
      },
    ],
    [],
  );
};
