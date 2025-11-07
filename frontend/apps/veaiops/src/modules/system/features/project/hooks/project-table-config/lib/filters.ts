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

import type { BaseQuery, FieldItem, HandleFilterProps } from '@veaiops/components';

/**
 * 获取项目表格筛选器配置
 *
 * 注意：后端只支持 name 参数筛选（veaiops/handler/routers/apis/v1/system_config/project.py）
 * 不支持 project_id 和 is_active 参数，因此只保留 name 筛选器
 */
export const getProjectTableFilters = (
  props: HandleFilterProps<BaseQuery>,
): FieldItem[] => {
  const { query, handleChange } = props;
  return [
    {
      field: 'name',
      label: '项目名称',
      type: 'Input',
      componentProps: {
        placeholder: '请输入项目名称',
        allowClear: true,
        value: query.name as string | undefined,
        onChange: (v: string) => {
          handleChange({ key: 'name', value: v });
        },
      },
    },
  ];
};
