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
 * 实例选择步骤数据管理Hook
 * @description 处理不同数据源的实例数据获取
 * @author AI Assistant
 * @date 2025-01-16
 */

import { DataSource } from '@veaiops/api-client';
import type {
  Connect,
  ZabbixHost,
  ZabbixTemplate,
  ZabbixTemplateMetric,
} from 'api-generate';
import { useEffect, useRef } from 'react';
import type {
  AliyunInstance,
  AliyunMetric,
  DataSourceType,
  VolcengineInstance,
  VolcengineMetric,
  WizardActions,
} from '../../../types';

// 定义 ZabbixMetric 类型别名
type ZabbixMetric = ZabbixTemplateMetric;

export interface UseInstanceDataProps {
  dataSourceType: DataSourceType;
  connect: Connect;
  // Zabbix 相关
  selectedTemplate?: ZabbixTemplate | null;
  selectedZabbixMetric?: ZabbixMetric | null;
  zabbixHosts: ZabbixHost[];
  // 阿里云相关
  selectedAliyunMetric?: AliyunMetric | null;
  aliyunInstances: AliyunInstance[];
  // 火山引擎相关
  selectedVolcengineMetric?: VolcengineMetric | null;
  volcengineInstances: VolcengineInstance[];
  volcengineRegion?: string | null; // 火山引擎区域
  loading: boolean;
  actions: WizardActions;
}

export const useInstanceData = ({
  dataSourceType,
  connect,
  selectedTemplate,
  selectedZabbixMetric,
  zabbixHosts,
  selectedAliyunMetric,
  aliyunInstances,
  selectedVolcengineMetric,
  volcengineInstances,
  volcengineRegion,
  loading,
  actions,
}: UseInstanceDataProps) => {
  // 使用 useRef 来跟踪请求状态，防止重复请求
  const requestTracker = useRef<{
    zabbix: string | null;
    aliyun: string | null;
    volcengine: string | null;
  }>({
    zabbix: null,
    aliyun: null,
    volcengine: null,
  });

  // 使用 useEffect 来处理数据获取
  useEffect(() => {
    // 添加调试日志
    if (process.env.NODE_ENV === 'development') {
      // Development mode debugging can be added here
    }

    // Zabbix 数据源处理
    if (
      dataSourceType === DataSource.type.ZABBIX &&
      connect?.name &&
      selectedTemplate?.templateid &&
      zabbixHosts.length === 0 &&
      !loading
    ) {
      const requestKey = `${connect.name}-${selectedTemplate.templateid}`;

      // 检查是否已经发起过相同的请求
      if (requestTracker.current.zabbix !== requestKey) {
        requestTracker.current.zabbix = requestKey;
        actions.fetchZabbixHosts(connect.name, selectedTemplate.templateid);
      }
      // Already requested, skip
    }

    // 阿里云数据源处理
    else if (
      dataSourceType === DataSource.type.ALIYUN &&
      connect?.name &&
      selectedAliyunMetric?.metricName &&
      aliyunInstances.length === 0 &&
      !loading
    ) {
      const requestKey = `${connect.name}-${selectedAliyunMetric.metricName}`;

      if (requestTracker.current.aliyun !== requestKey) {
        requestTracker.current.aliyun = requestKey;
        actions.fetchAliyunInstances(
          connect.name,
          selectedAliyunMetric.namespace,
          selectedAliyunMetric.metricName,
        );
      }
      // Already requested, skip
    }

    // 火山引擎数据源处理
    else if (
      dataSourceType === DataSource.type.VOLCENGINE &&
      connect?.name &&
      selectedVolcengineMetric?.metricName &&
      selectedVolcengineMetric?.namespace &&
      volcengineInstances.length === 0 &&
      !loading &&
      volcengineRegion && // 确保 region 已选择
      volcengineRegion.trim() // 确保 region 不是空字符串
    ) {
      const requestKey = `${connect.name}-${volcengineRegion}-${selectedVolcengineMetric.metricName}`;

      if (requestTracker.current.volcengine !== requestKey) {
        requestTracker.current.volcengine = requestKey;

        try {
          actions.fetchVolcengineInstances(
            connect.name,
            volcengineRegion, // 使用传入的 region
            selectedVolcengineMetric.namespace,
            selectedVolcengineMetric.subNamespace || '',
            selectedVolcengineMetric.metricName,
          );
        } catch (error) {
          // 重置请求跟踪器，允许重试
          requestTracker.current.volcengine = null;
        }
      }
    }
  }, [
    dataSourceType,
    connect?.name,
    selectedTemplate?.templateid,
    selectedZabbixMetric?.metric_name,
    selectedAliyunMetric?.metricName,
    selectedVolcengineMetric?.metricName,
    zabbixHosts.length,
    aliyunInstances.length,
    volcengineInstances.length,
    volcengineRegion,
    loading,
    actions,
  ]);

  // 重置请求跟踪器当数据源类型或连接改变时
  useEffect(() => {
    requestTracker.current = {
      zabbix: null,
      aliyun: null,
      volcengine: null,
    };
  }, [dataSourceType, connect?.name]);

  return {
    requestTracker,
  };
};
