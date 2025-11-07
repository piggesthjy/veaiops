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

// ✅ 优化：使用统一导出
import { channelTypeOptions } from '@ec/strategy';

import type { FieldItem, HandleFilterProps } from '@veaiops/components';

/**
 * 策略过滤器配置函数
 * 按照 CustomTable 最佳实践，提供完整的过滤器配置
 *
 * 返回类型明确为 FieldItem[]，避免类型断言
 */
// ✅ 优化：使用正确的 HandleFilterProps 类型
export const getStrategyFilters = ({
  query,
  handleChange,
  handleFiltersProps,
}: HandleFilterProps<Record<string, unknown>> & {
  handleFiltersProps?: Record<string, unknown>;
}): FieldItem[] => {
  const { botsOptions = [] } = handleFiltersProps || {};
  return [
    {
      field: 'name',
      label: '策略名称',
      type: 'Input',
      componentProps: {
        placeholder: '请输入策略名称（模糊查找）',
        value: query?.name as string | undefined,
        allowClear: true,
        onChange: (v: string) => {
          // ✅ 正确：handleChange 接受 HandleChangeSingleParams，即 { key: string; value?: unknown }
          handleChange({ key: 'name', value: v });
        },
      },
    },
    {
      field: 'channel',
      label: '企业协同工具',
      type: 'Select',
      componentProps: {
        placeholder: '选择企业协同工具',
        value: query?.channel as string | undefined,
        allowClear: true,
        options: channelTypeOptions,
        onChange: (v: string) => {
          handleChange({ key: 'channel', value: v });
        },
      },
    },
    {
      field: 'botId',
      label: '机器人',
      type: 'Select',
      componentProps: {
        placeholder: '请选择机器人',
        value: query?.botId as string | undefined,
        allowClear: true,
        options: botsOptions as Array<{ label: string; value: string }>,
        onChange: (v: string) => {
          handleChange({ key: 'botId', value: v });
        },
      },
    },
  ];
};
