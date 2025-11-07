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

import {
  EVENT_LEVEL_OPTIONS,
  EVENT_SHOW_STATUS_OPTIONS,
} from '@/modules/event-center/features/subscription/constants/options';
import {
  AGENT_OPTIONS_ONCALL_HISTORY,
  AGENT_OPTIONS_THRESHOLD_FILTER,
} from '@/pages/event-center/card-template/types';
import { Message } from '@arco-design/web-react';
import type { FieldItem, HandleFilterProps } from '@veaiops/components';
import { ModuleType } from '@veaiops/types';
import type { EventShowStatus } from 'api-generate';

/**
 * 获取历史事件过滤器配置
 *
 * 🔧 修复说明（与 origin/feat/web-v2 对齐）：
 * - 字段名使用 snake_case（agent_type, event_level, show_status），与后端 API 参数一致
 * - 添加 show_status 筛选器，支持筛选事件状态
 * - 确保 onChange 中空数组时传递 undefined，正确移除字段
 */
export const getPushHistoryFilters = ({
  query,
  handleChange,
  handleFiltersProps = {},
}: {
  query: Record<string, unknown>;
  handleChange: HandleFilterProps<unknown>['handleChange'];
  handleFiltersProps?: Record<string, unknown>;
}): FieldItem[] => {
  const { moduleType } = handleFiltersProps as { moduleType?: ModuleType };

  // 根据模块类型决定Agent选项和是否必填
  const agentOptions =
    moduleType === ModuleType.ONCALL
      ? AGENT_OPTIONS_ONCALL_HISTORY
      : AGENT_OPTIONS_THRESHOLD_FILTER;

  // 智能阈值模块：必填，默认选中智能阈值Agent
  // Oncall模块：支持多选，必须至少选一个，默认全选（3个都选中）
  const defaultAgentValue =
    moduleType === ModuleType.ONCALL
      ? AGENT_OPTIONS_ONCALL_HISTORY.map((opt) => opt.value)
      : [AGENT_OPTIONS_THRESHOLD_FILTER[0].value];

  return [
    {
      field: 'agent_type',
      label: '智能体', // ✅ 简洁写法：label 自动转换为 addBefore
      type: 'Select',
      componentProps: {
        placeholder: '请选择智能体',
        mode: 'multiple',
        maxTagCount: 1,
        value: (query?.agent_type as string[] | undefined) || defaultAgentValue,
        defaultActiveFirstOption: true,
        allowClear: false,
        options: agentOptions,
        onChange: (v: string | string[]) => {
          if (Array.isArray(v) && v.length === 0) {
            Message.warning('智能体不能为空');
            return;
          }
          // 🔧 修复：使用 agent_type (snake_case) 而不是 agentType (camelCase)
          // 确保与 queryFormat 中定义的字段名一致，与后端 API 参数一致
          handleChange({ key: 'agent_type', value: v });
        },
      },
    },
    {
      field: 'event_level',
      label: '事件级别', // ✅ 简洁写法：label 自动转换为 addBefore
      type: 'Select',
      componentProps: {
        placeholder: '请选择事件级别',
        mode: 'multiple',
        value: query?.event_level as string[] | undefined,
        allowClear: true,
        options: EVENT_LEVEL_OPTIONS,
        maxTagCount: 3,
        onChange: (v: string[]) => {
          // 🔧 修复：使用 event_level (snake_case) 而不是 eventLevel (camelCase)
          // 确保与 queryFormat 中定义的字段名一致，与后端 API 参数一致
          // 确保空数组时传递 undefined，而不是空数组，这样可以确保 handleChange 正确移除该字段
          handleChange({
            key: 'event_level',
            value: v && v.length > 0 ? v : undefined,
          });
        },
      },
    },
    {
      field: 'show_status',
      label: '状态', // ✅ 简洁写法：label 自动转换为 addBefore
      type: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        mode: 'multiple',
        value: query?.show_status as EventShowStatus[] | undefined,
        allowClear: true,
        options: EVENT_SHOW_STATUS_OPTIONS,
        maxTagCount: 1,
        onChange: (v: EventShowStatus[]) => {
          // 🔧 修复：确保空数组时传递 undefined，而不是空数组
          // 这样可以确保 handleChange 正确移除该字段
          handleChange({
            key: 'show_status',
            value: v && v.length > 0 ? v : undefined,
          });
        },
      },
    },
  ];
};
