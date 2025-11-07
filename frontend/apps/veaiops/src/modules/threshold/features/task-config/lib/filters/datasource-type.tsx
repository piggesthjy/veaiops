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

import { useTaskConfigStore } from "@/stores/task-config-store";
import type { FieldItem, HandleFilterProps } from "@veaiops/components";
import { DataSourceType } from "@veaiops/api-client";
import type { TaskFiltersQuery } from "./types";

/**
 * 数据源类型选项配置
 * 使用 @veaiops/api-client 中生成的 DataSourceType 枚举值
 */
const DATASOURCE_TYPE_OPTIONS = [
  { label: '火山引擎', value: DataSourceType.VOLCENGINE },
  { label: '阿里云', value: DataSourceType.ALIYUN },
  { label: 'Zabbix', value: DataSourceType.ZABBIX },
] as const;

/**
 * 数据源类型筛选器
 */
export const createDatasourceTypeFilter = (
  props: HandleFilterProps<TaskFiltersQuery>,
): FieldItem => {
  const { query, handleChange } = props;

  return {
    field: 'datasource_type',
    label: '数据源类型',
    type: 'Select',
    componentProps: {
      placeholder: '请选择数据源类型',
      value: (() => {
        // 优先使用 query 中的值
        if (query?.datasource_type) {
          return query.datasource_type as string;
        }

        // 如果 query 中没有，从 URL 参数中获取
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const urlDatasourceType = urlParams.get('datasource_type');
          if (urlDatasourceType) {
            return urlDatasourceType;
          }
        }

        // 最后从 store 中获取
        const storeDatasourceType = useTaskConfigStore.getState().filterDatasourceType;
        if (storeDatasourceType) {
          return storeDatasourceType;
        }

        // 都为空时，使用默认值 DataSourceType.VOLCENGINE（火山引擎）
        return DataSourceType.VOLCENGINE;
      })(),
      defaultActiveFirstOption: true,
      allowClear: false,
      options: DATASOURCE_TYPE_OPTIONS,
      onChange: (v: string) => {
        handleChange({ key: 'datasource_type', value: v });

        // 更新 store 中的筛选器数据源类型，用于新建任务时的默认值联动
        const { setFilterDatasourceType } = useTaskConfigStore.getState();
        setFilterDatasourceType(v);
      },
    },
  };
};
