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
 * 连接过滤器组件
 * @description 处理连接的过滤和搜索逻辑
 * @author AI Assistant
 * @date 2025-01-17
 */

import {
  DataSourceType as ApiDataSourceType,
  DataSource,
} from '@veaiops/api-client';
import type { Connect } from 'api-generate';
import type { DataSourceType } from '../../../types';

export const useConnectFilter = (
  connects: Connect[],
  dataSourceType?: DataSourceType | 'all',
  searchText = '',
) => {
  const filteredConnects = connects.filter((connect) => {
    // 根据数据源类型过滤 - 转换API类型到本地类型
    let typeMatch = !dataSourceType || dataSourceType === 'all';
    if (!typeMatch) {
      if (
        connect.type === ApiDataSourceType.ZABBIX &&
        dataSourceType === DataSource.type.ZABBIX
      ) {
        typeMatch = true;
      } else if (
        connect.type === ApiDataSourceType.ALIYUN &&
        dataSourceType === DataSource.type.ALIYUN
      ) {
        typeMatch = true;
      } else if (
        connect.type === ApiDataSourceType.VOLCENGINE &&
        dataSourceType === DataSource.type.VOLCENGINE
      ) {
        typeMatch = true;
      }
    }

    // 根据搜索文本过滤
    const searchMatch =
      !searchText ||
      connect.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      connect.description?.toLowerCase().includes(searchText.toLowerCase());

    return typeMatch && searchMatch;
  });

  return { filteredConnects };
};

export const getDataSourceTypeLabel = (type: DataSourceType) => {
  switch (type) {
    case DataSource.type.ZABBIX:
      return 'Zabbix';
    case DataSource.type.ALIYUN:
      return '阿里云';
    case DataSource.type.VOLCENGINE:
      return '火山引擎';
    default:
      return type;
  }
};

export const getConnectStatusColor = (isActive?: boolean) => {
  return isActive ? 'green' : 'red';
};

export const getConnectStatusText = (isActive?: boolean) => {
  return isActive ? '已激活' : '未激活';
};
