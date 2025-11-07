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
 * 全局连接管理Hook
 */

import { logger } from '@veaiops/utils';
import { DataSourceType } from 'api-generate';
import { useCallback, useEffect, useState } from 'react';
import { useConnections } from './use-connections';

/**
 * 连接统计信息
 */
interface ConnectionStats {
  total: number;
  active: number;
  inactive: number;
}

/**
 * 全局连接统计信息
 */
interface GlobalConnectionStats {
  zabbix: ConnectionStats;
  aliyun: ConnectionStats;
  volcengine: ConnectionStats;
}

interface UseGlobalConnectionManagerReturn {
  connectionStats: GlobalConnectionStats;
  refreshAll: () => Promise<boolean>;
  loading: boolean;
}

interface UseGlobalConnectionManagerProps {
  visible?: boolean;
}

export const useGlobalConnectionManager = (
  props: UseGlobalConnectionManagerProps = {},
): UseGlobalConnectionManagerReturn => {
  const { visible = false } = props;
  const [loading, setLoading] = useState(false);

  // 各数据源的连接管理Hook
  const zabbixConnections = useConnections(DataSourceType.ZABBIX);
  const aliyunConnections = useConnections(DataSourceType.ALIYUN);
  const volcengineConnections = useConnections(DataSourceType.VOLCENGINE);

  // 计算连接统计信息
  const getConnectionStats = useCallback(
    (connections: any[]): ConnectionStats => {
      const total = connections.length;
      const active = connections.filter((conn) => conn.is_active).length;
      const inactive = total - active;

      return { total, active, inactive };
    },
    [],
  );

  // 全局连接统计
  const connectionStats: GlobalConnectionStats = {
    zabbix: getConnectionStats(zabbixConnections.connections),
    aliyun: getConnectionStats(aliyunConnections.connections),
    volcengine: getConnectionStats(volcengineConnections.connections),
  };

  // 刷新所有连接
  const refreshAll = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      await Promise.all([
        zabbixConnections.refresh(),
        aliyunConnections.refresh(),
        volcengineConnections.refresh(),
      ]);
      return true;
    } catch (error: unknown) {
      // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.warn({
        message: '刷新连接失败',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'GlobalConnectionManager',
        component: 'refreshAll',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [zabbixConnections, aliyunConnections, volcengineConnections]);

  // 只在可见时刷新所有连接
  useEffect(() => {
    if (visible) {
      refreshAll();
    }
  }, [visible, refreshAll]);

  return {
    connectionStats,
    refreshAll,
    loading:
      loading ||
      zabbixConnections.loading ||
      aliyunConnections.loading ||
      volcengineConnections.loading,
  };
};
