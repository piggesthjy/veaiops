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
 * 实例选择步骤日志管理Hook
 * @description 处理实例选择相关的日志收集和导出
 * @author AI Assistant
 * @date 2025-01-16
 */

import type {
  Connect,
  ZabbixHost,
  ZabbixTemplate,
  ZabbixTemplateMetric,
} from 'api-generate';
import { useCallback } from 'react';
import type {
  AliyunInstance,
  AliyunMetric,
  DataSourceType,
  VolcengineInstance,
  VolcengineMetric,
} from '../../../types';

// 定义 ZabbixMetric 类型别名
type ZabbixMetric = ZabbixTemplateMetric;

export interface UseInstanceLogsProps {
  dataSourceType: DataSourceType;
  connect: Connect;
  selectedTemplate?: ZabbixTemplate | null;
  selectedZabbixMetric?: ZabbixMetric | null;
  selectedAliyunMetric?: AliyunMetric | null;
  selectedVolcengineMetric?: VolcengineMetric | null;
  // 实例数据
  zabbixHosts?: ZabbixHost[];
  aliyunInstances?: AliyunInstance[];
  volcengineInstances?: VolcengineInstance[];
  instancesCount: number;
}

export const useInstanceLogs = ({
  dataSourceType,
  connect,
  selectedTemplate,
  selectedZabbixMetric,
  selectedAliyunMetric,
  selectedVolcengineMetric,
  zabbixHosts = [],
  aliyunInstances = [],
  volcengineInstances = [],
  instancesCount,
}: UseInstanceLogsProps) => {
  const handleExportLogs = useCallback(() => {
    const logData = {
      timestamp: new Date().toISOString(),
      component: 'InstanceSelectionStep',
      dataSourceType,
      connect: {
        name: connect?.name,
        type: connect?.type,
      },
      selectedTemplate: selectedTemplate
        ? {
            templateid: selectedTemplate.templateid,
            name: selectedTemplate.name,
          }
        : null,
      selectedMetric: {
        zabbix: selectedZabbixMetric
          ? {
              metric_name: selectedZabbixMetric.metric_name,
              name: selectedZabbixMetric.name,
              key_: selectedZabbixMetric.key_,
            }
          : null,
        aliyun: selectedAliyunMetric
          ? {
              metricName: selectedAliyunMetric.metricName,
              namespace: selectedAliyunMetric.namespace,
            }
          : null,
        volcengine: selectedVolcengineMetric
          ? {
              metricName: selectedVolcengineMetric.metricName,
              namespace: selectedVolcengineMetric.namespace,
              subNamespace: selectedVolcengineMetric.subNamespace,
            }
          : null,
      },
      instances: {
        zabbix: {
          count: zabbixHosts.length,
          hosts: zabbixHosts.map((host) => ({
            host: host.host,
            name: host.name,
          })),
        },
        aliyun: {
          count: aliyunInstances.length,
          instances: aliyunInstances.map((instance) => ({
            instanceId: instance.instanceId,
            instanceName: instance.instanceName,
            region: instance.region,
          })),
        },
        volcengine: {
          count: volcengineInstances.length,
          instances: volcengineInstances.map((instance) => ({
            instanceId: instance.instanceId,
            instanceName: instance.instanceName,
            region: instance.region,
          })),
        },
      },
      summary: {
        totalInstancesCount: instancesCount,
        dataSourceType,
        hasSelectedMetric: Boolean(
          selectedZabbixMetric ||
            selectedAliyunMetric ||
            selectedVolcengineMetric,
        ),
      },
    };

    // 记录日志到系统

    // 导出日志文件
    exportLogsToFile(
      `instance-selection-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`,
    );
  }, [
    dataSourceType,
    connect,
    selectedTemplate,
    selectedZabbixMetric,
    selectedAliyunMetric,
    selectedVolcengineMetric,
    zabbixHosts,
    aliyunInstances,
    volcengineInstances,
    instancesCount,
  ]);

  return {
    handleExportLogs,
  };
};
