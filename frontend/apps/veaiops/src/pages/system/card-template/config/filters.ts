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
 * 卡片模版管理过滤器配置

 */

import { channelTypeOptions } from '@/modules/event-center/features/strategy/constants/options';
import { AGENT_TYPE_OPTIONS } from '@/pages/event-center/card-template/types';
import type { AgentTemplateQuery } from '../types';

interface FilterConfigProps {
  query: AgentTemplateQuery;
  handleChange: (
    params:
      | { key: string; value?: unknown }
      | { updates: Record<string, unknown> },
  ) => void;
}

/**
 * 获取卡片模版管理过滤器配置
 */
export const getCardTemplateFilters = ({
  query,
  handleChange,
}: FilterConfigProps) => {
  return [
    {
      type: 'Input',
      componentProps: {
        addBefore: '卡片模版ID',
        value: query?.templateId,
        allowClear: true,
        onChange: (v: string) => handleChange({ key: 'templateId', value: v }),
      },
    },
    // Agent类型筛选
    {
      type: 'Select',
      componentProps: {
        addBefore: '智能体',
        value: query?.agents,
        allowClear: true,
        options: AGENT_TYPE_OPTIONS,
        mode: 'multiple',
        onChange: (v: string[]) => handleChange({ key: 'agents', value: v }),
      },
    },

    // 通道类型筛选（当前仅支持飞书）
    {
      type: 'Select',
      componentProps: {
        addBefore: '企业协同工具',
        value: query?.channels,
        allowClear: true,
        options: channelTypeOptions,
        mode: 'multiple',
        onChange: (v: string) => handleChange({ key: 'channels', value: v }),
      },
    },
    // // 创建时间范围
    // {
    //   type: "RangePicker",
    //   componentProps: {
    //     prefix: "创建时间",
    //     value: query?.createTimeRanges,
    //     showTime: true,
    //     onChange: (v: number[]) => {
    //       handleChange("createTimeRanges", v);
    //     },
    //   },
    // },
  ];
};
