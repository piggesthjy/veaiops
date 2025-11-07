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

import { AgentType, EventShowStatus } from '@veaiops/api-client';
import type {
  BaseQuery,
  HandleFilterProps,
} from '../custom-table/types/core/common';
import type { FieldItem } from '../filters/core/types';
import type { EventHistoryFilters, HistoryModuleType } from './types';
import {
  HistoryModuleType as ModuleTypeEnum,
  getAllowedAgentTypes,
} from './types';

/**
 * 获取智能体类型选项
 */
const getAgentTypeOptions = (moduleType: HistoryModuleType) => {
  const agentTypeMap: Record<AgentType, string> = {
    [AgentType.INTELLIGENT_THRESHOLD_AGENT]: '智能阈值Agent',
    [AgentType.CHATOPS_INTEREST_AGENT]: '内容识别Agent',
    [AgentType.CHATOPS_PROACTIVE_REPLY_AGENT]: '主动回复Agent',
    [AgentType.CHATOPS_REACTIVE_REPLY_AGENT]: '被动回复Agent',
  };

  const allowedTypes = getAllowedAgentTypes(moduleType);

  return allowedTypes.map((type) => ({
    label: agentTypeMap[type] || type,
    value: type,
  }));
};

/**
 * 获取智能体默认值
 */
const getDefaultAgentType = (moduleType: HistoryModuleType): AgentType[] => {
  switch (moduleType) {
    case ModuleTypeEnum.INTELLIGENT_THRESHOLD:
      // 智能阈值：默认选中智能阈值Agent
      return [AgentType.INTELLIGENT_THRESHOLD_AGENT];
    case ModuleTypeEnum.CHATOPS:
      // ChatOps：默认全选（3个Agent都选中）
      return [
        AgentType.CHATOPS_INTEREST_AGENT,
        AgentType.CHATOPS_PROACTIVE_REPLY_AGENT,
        AgentType.CHATOPS_REACTIVE_REPLY_AGENT,
      ];
    case ModuleTypeEnum.EVENT_CENTER:
      // 事件中心：默认选中所有Agent
      return Object.values(AgentType);
    default:
      return [];
  }
};

/**
 * 获取事件级别选项
 */
const getEventLevelOptions = () => [
  { label: 'P0', value: 'P0' },
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
];

/**
 * 获取显示状态选项
 * 使用后端 EventShowStatus 枚举（中文）
 */
const getShowStatusOptions = () => [
  {
    label: '等待发送',
    value: EventShowStatus.PENDING,
    extra: { color: 'blue' },
  },
  {
    label: '发送成功',
    value: EventShowStatus.SUCCESS,
    extra: { color: 'green' },
  },
  {
    label: '未订阅',
    value: EventShowStatus.NOT_SUBSCRIBED,
    extra: { color: 'orange' },
  },
  {
    label: '未命中规则',
    value: EventShowStatus.NOT_MATCHED,
    extra: { color: 'red' },
  },
  {
    label: '命中过滤规则',
    value: EventShowStatus.FILTERED,
    extra: { color: 'purple' },
  },
  {
    label: '告警抑制',
    value: EventShowStatus.RESTRAINED,
    extra: { color: 'magenta' },
  },
];

/**
 * 获取历史事件筛选器配置
 */
export const getEventHistoryFilters = ({
  moduleType,
  query,
  handleChange,
}: HandleFilterProps<EventHistoryFilters> & {
  moduleType: HistoryModuleType;
}): FieldItem[] => {
  const defaultAgentType = getDefaultAgentType(moduleType);

  return [
    {
      field: 'agent_type',
      label: '智能体',
      type: 'Select',
      componentProps: {
        mode: 'multiple',
        placeholder: '请选择智能体',
        maxTagCount: 1,
        value: query.agent_type || defaultAgentType,
        defaultActiveFirstOption: true,
        allowClear: false,
        options: getAgentTypeOptions(moduleType),
        onChange: (value: AgentType[]) => {
          handleChange({ key: 'agent_type', value });
        },
      },
    },
    {
      field: 'event_level',
      label: '事件级别',
      type: 'Select',
      componentProps: {
        mode: 'multiple',
        placeholder: '请选择事件级别',
        maxTagCount: 3,
        value: query.event_level,
        allowClear: true,
        options: getEventLevelOptions(),
        onChange: (value: string[]) => {
          handleChange({
            key: 'event_level',
            value: value && value.length > 0 ? value : undefined,
          });
        },
      },
    },
    {
      field: 'show_status',
      label: '状态',
      type: 'Select',
      componentProps: {
        mode: 'multiple',
        placeholder: '请选择状态',
        maxTagCount: 1,
        value: query.show_status,
        allowClear: true,
        options: getShowStatusOptions(),
        onChange: (value: string[]) => {
          handleChange({
            key: 'show_status',
            value: value && value.length > 0 ? value : undefined,
          });
        },
      },
    },
    {
      field: 'time_range',
      label: '时间范围',
      type: 'RangePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        value:
          query.start_time && query.end_time
            ? [query.start_time, query.end_time]
            : undefined,
        onChange: (value: [string, string] | undefined) => {
          if (value) {
            handleChange({
              updates: {
                start_time: value[0],
                end_time: value[1],
              },
            });
          } else {
            handleChange({
              updates: {
                start_time: undefined,
                end_time: undefined,
              },
            });
          }
        },
      },
    },
  ];
};
