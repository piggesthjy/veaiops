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

import type { FieldItem, HandleFilterProps } from "@veaiops/components";
import type { TaskFiltersQuery } from "./types";

/**
 * 任务名称筛选器
 */
export const createTaskNameFilter = (
  props: HandleFilterProps<TaskFiltersQuery>,
): FieldItem => {
  const { query, handleChange } = props;

  return {
    field: 'task_name',
    label: '任务名称',
    type: 'Input',
    componentProps: {
      placeholder: '请输入任务名称',
      value: query.task_name,
      allowClear: true,
      onChange: (v: string) => {
        handleChange({ key: 'task_name', value: v });
      },
    },
  };
};
