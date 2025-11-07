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

import { Badge, Space, Tabs } from '@arco-design/web-react';
import { DATA_SOURCE_TYPES } from '@datasource/lib';
import type { DataSource } from 'api-generate';
import { MonitorTable } from '../../components';
import { getTableRef } from '../config';
import type { DataSourceConfig, TableRefMap } from '../types';

const { TabPane } = Tabs;

/**
 * 渲染数据源 TabPane 的辅助函数
 *
 * 注意：不能使用组件包装，因为 Arco Tabs 使用 React.Children.forEach
 * 只能识别直接子元素，必须直接在 Tabs 内部调用此函数
 */
export const renderDataSourceTabs = (
  dataSourceConfigs: DataSourceConfig[],
  tableRefMap: TableRefMap,
  onEdit: (dataSource: DataSource) => void,
) => {
  return dataSourceConfigs.map((config) => {
    const dataSourceConfig =
      DATA_SOURCE_TYPES[config.type as keyof typeof DATA_SOURCE_TYPES];
    return (
      <TabPane
        key={config.key}
        title={
          <Space>
            {dataSourceConfig.label}
            <Badge count={0} />
          </Space>
        }
      >
        <MonitorTable
          ref={getTableRef(config.tableRefKey, tableRefMap)}
          onEdit={onEdit}
          onDelete={config.deleteHandler}
          dataSourceType={config.type}
        />
      </TabPane>
    );
  });
};
