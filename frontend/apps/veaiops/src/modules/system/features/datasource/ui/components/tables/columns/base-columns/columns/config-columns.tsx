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

import type { DataSourceType } from '@/modules/system/features/datasource/lib';
import type { ModernTableColumnProps } from '@veaiops/components';
import { CellRender } from '@veaiops/components';
import type { DataSource } from 'api-generate';
import {
  createAliyunFields,
  createVolcengineFields,
  createZabbixFields,
} from '../specific-fields';
import { getConfigData } from '../utils';

/**
 * 配置信息列配置 - 根据数据源类型动态生成表头分组
 */
export const getConfigColumns = (
  dataSourceType: DataSourceType,
): ModernTableColumnProps<DataSource> => {
  // 基础字段（所有数据源都有）
  const baseFields: ModernTableColumnProps<DataSource>[] = [
    {
      title: '连接名称',
      key: 'connect_name',
      dataIndex: 'connect_name',
      width: 120,
      align: 'center',
      render: (_: unknown, record: DataSource) => {
        const configData = getConfigData({ record, dataSourceType });
        const connectName = configData?.connect_name || record.name;
        if (!connectName) {
          return <CellRender.Ellipsis text="-" />;
        }
        return <CellRender.Ellipsis text={String(connectName)} />;
      },
    },
    {
      title: '监控项',
      key: 'metric_name',
      dataIndex: 'metric_name',
      width: 120,
      align: 'center',
      render: (_: unknown, record: DataSource) => {
        const configData = getConfigData({ record, dataSourceType });
        const metricName = configData?.metric_name;
        if (!metricName) {
          return <CellRender.Ellipsis text="-" />;
        }
        return <CellRender.Ellipsis text={String(metricName)} />;
      },
    },
  ];

  // 根据数据源类型添加特定字段
  let specificFields: Array<ModernTableColumnProps<DataSource>> = [];

  switch (dataSourceType) {
    case 'Volcengine':
      specificFields = createVolcengineFields(dataSourceType);
      break;
    case 'Aliyun':
      specificFields = createAliyunFields(dataSourceType);
      break;
    case 'Zabbix':
      specificFields = createZabbixFields(dataSourceType);
      break;
    default:
      specificFields = [];
  }

  return {
    title: '配置信息',
    children: [...baseFields, ...specificFields],
  };
};
