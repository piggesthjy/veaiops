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
 * 监控数据源管理相关自定义Hooks
 */

import { Message } from '@arco-design/web-react';
import { DataSourceType } from 'api-generate';
import { useCallback, useState } from 'react';
import { DataSourceApiService } from '../lib/api-service';
import type { MonitorItem } from '../lib/types';
import { transformDataSourceToMonitorItem } from '../lib/utils';

/**
 * 监控数据源管理Hook
 */
export const useDataSourceManagement = (type: DataSourceType) => {
  const [data, setData] = useState<MonitorItem[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 获取数据源列表
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await DataSourceApiService.getDataSourcesByType(type);

      const transformedData = response.map((ds) =>
        transformDataSourceToMonitorItem(ds, type),
      );

      setData(transformedData);
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || `获取${type}数据源失败，请重试`;
      Message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [type]);

  /**
   * 删除数据源
   */
  const deleteDataSource = useCallback(
    async (id: string) => {
      const result = await DataSourceApiService.deleteDataSourceByType(
        type,
        id,
      );
      if (result.success) {
        Message.success('删除成功');
        await fetchData(); // 重新获取数据
      } else if (result.error) {
        const errorMessage =
          result.error instanceof Error
            ? result.error.message
            : '删除失败，请重试';
        Message.error(errorMessage);
      }
    },
    [type, fetchData],
  );

  return {
    data,
    loading,
    fetchData,
    deleteDataSource,
  };
};

/**
 * Zabbix数据源Hook
 */
export const useZabbixDataSource = () => {
  // ✅ 类型安全：使用枚举值替代字符串字面量
  return useDataSourceManagement(DataSourceType.ZABBIX);
};

/**
 * 阿里云数据源Hook
 */
export const useAliyunDataSource = () => {
  // ✅ 类型安全：使用枚举值替代字符串字面量
  return useDataSourceManagement(DataSourceType.ALIYUN);
};

/**
 * 火山引擎数据源Hook
 */
export const useVolcengineDataSource = () => {
  // ✅ 类型安全：使用枚举值替代字符串字面量
  return useDataSourceManagement(DataSourceType.VOLCENGINE);
};

/**
 * 详情查看Hook
 */
export const useDetailView = () => {
  const [visible, setVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<MonitorItem | null>(null);

  const showDetail = useCallback((item: MonitorItem) => {
    setCurrentItem(item);
    setVisible(true);
  }, []);

  const hideDetail = useCallback(() => {
    setVisible(false);
    setCurrentItem(null);
  }, []);

  return {
    visible,
    currentItem,
    showDetail,
    hideDetail,
  };
};
