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
 * 连接相关工具函数
 * @description 提供连接状态和数据源类型的工具函数
 * @date 2025-01-19
 */

import {
  DataSourceType as ApiDataSourceType,
  DataSource,
} from '@veaiops/api-client';
import type { Connect } from '@veaiops/api-client';
import type { DataSourceType } from '../types';

/**
 * 连接过滤参数接口
 */
export interface UseConnectFilterParams {
  connects: Connect[];
  dataSourceType?: DataSourceType | 'all';
  searchText?: string;
}

/**
 * 连接过滤 Hook
 * @description 根据数据源类型和搜索文本过滤连接列表
 */
export const useConnectFilter = ({
  connects,
  dataSourceType,
  searchText = '',
}: UseConnectFilterParams) => {
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

/**
 * 获取数据源类型的中文标签
 * @param type 数据源类型（支持本地类型和 API 类型）
 * @returns 中文标签
 */
export const getDataSourceTypeLabel = (
  type: ApiDataSourceType | string,
): string => {
  // 将类型转换为小写进行比较（兼容API类型和本地类型）
  const typeStr = String(type).toLowerCase();

  switch (typeStr) {
    case 'zabbix':
      return 'Zabbix';
    case 'aliyun':
      return '阿里云';
    case 'volcengine':
      return '火山引擎';
    default:
      return String(type);
  }
};

/**
 * 获取连接状态的颜色
 * @param isActive 是否激活
 * @returns 颜色标识
 */
export const getConnectStatusColor = (isActive?: boolean) => {
  return isActive ? 'green' : 'red';
};

/**
 * 获取连接状态的Badge类型
 * @param isActive 是否激活
 * @returns Badge状态
 */
export const getConnectStatusBadge = (isActive?: boolean) => {
  return isActive ? 'success' : 'error';
};

/**
 * 获取连接状态的中文文本
 * @param isActive 是否激活
 * @returns 中文状态文本
 */
export const getConnectStatusText = (isActive?: boolean) => {
  return isActive ? '已激活' : '未激活';
};
