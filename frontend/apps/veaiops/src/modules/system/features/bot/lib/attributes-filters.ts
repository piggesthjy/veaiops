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

import type { FieldItem, HandleFilterProps } from '@veaiops/components';
import type { AttributeKey } from 'api-generate';

/**
 * Bot属性筛选查询参数接口
 */
export interface BotAttributeFiltersQuery {
  /**
   * 类目筛选（多选）
   * 对应后端 names 参数
   */
  names?: AttributeKey[];
  /**
   * 内容筛选（模糊搜索）
   * 对应后端 value 参数
   */
  value?: string;
  /**
   * 索引签名，满足 BaseQuery 约束
   */
  [key: string]: unknown;
}

/**
 * Bot属性表格筛选器配置
 * 按照后端接口参数要求进行配置
 *
 * ⚠️ 修复说明（解决无限循环问题）：
 * - 移除了直接调用 handleChange 的逻辑，避免在 handleFilters 函数中触发状态更新
 * - handleFilters 会在每次渲染时被调用（在 useMemo 中），不应该有副作用
 * - 默认值应该通过 CustomTable 的 initQuery 属性设置，而不是在 handleFilters 中设置
 * - 参考：frontend/packages/components/src/custom-table/types/components/props.ts (initQuery)
 */
export const getBotAttributeFilters = ({
  query,
  handleChange,
}: {
  query: BotAttributeFiltersQuery;
  handleChange: HandleFilterProps<BotAttributeFiltersQuery>['handleChange'];
}): FieldItem[] => {
  // 使用传入的 query.names，如果不存在则使用默认值（但不在函数中调用 handleChange）
  // 默认值应该在组件层面通过 initQuery 设置
  const currentNames = query?.names || ['project'];

  return [
    {
      field: 'names',
      label: '类目',
      type: 'Select',
      componentProps: {
        placeholder: '请选择类目',
        value: currentNames,
        mode: 'multiple',
        maxTagCount: 2,
        allowClear: false, // 不可清除
        disabled: true, // 禁用选择，因为只有一个选项且必选
        options: [{ label: '项目', value: 'project' }],
        onChange: (v: AttributeKey[]) => {
          handleChange({ key: 'names', value: v });
        },
      },
    },
    {
      field: 'value',
      label: '内容',
      type: 'Input',
      componentProps: {
        placeholder: '请输入内容',
        value: query?.value,
        allowClear: true,
        onChange: (v: string) => {
          handleChange({ key: 'value', value: v });
        },
      },
    },
  ];
};
