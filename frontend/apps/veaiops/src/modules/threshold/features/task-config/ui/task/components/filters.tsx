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
 * 任务配置表格筛选配置
 *
 * 将筛选配置逻辑单独抽象出来，提高代码可维护性
 */

import type { FieldItem, HandleFilterProps } from '@veaiops/components';
import { useCallback } from 'react';

/**
 * 任务配置表格筛选配置 Hook
 * 负责定义所有筛选条件和表单
 */
export const useTaskTableFilters = () => {
  return useCallback(
    (props: HandleFilterProps<Record<string, unknown>>): FieldItem[] => [
      {
        field: 'name',
        label: '任务名称',
        type: 'Input',
        componentProps: {
          placeholder: '请输入任务名称',
          value: props.query?.name as string | undefined,
          allowClear: true,
          onChange: (value: string) => {
            props.handleChange({ key: 'name', value });
          },
        },
      },
      {
        field: 'status',
        label: '状态',
        type: 'Select',
        componentProps: {
          placeholder: '请选择状态',
          value: props.query?.status as string | undefined,
          allowClear: true,
          options: [
            { label: '运行中', value: 'running' },
            { label: '已停止', value: 'stopped' },
            { label: '待运行', value: 'pending' },
          ],
          onChange: (value: string) => {
            props.handleChange({ key: 'status', value });
          },
        },
      },
    ],
    [],
  );
};
