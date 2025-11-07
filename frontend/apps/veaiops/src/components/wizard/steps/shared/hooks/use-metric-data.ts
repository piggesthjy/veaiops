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
 * 指标选择步骤数据管理Hook
 * @description 处理不同数据源的指标数据获取
 * @author AI Assistant
 * @date 2025-01-16
 */

import { DataSource } from '@veaiops/api-client';
import { logger } from '@veaiops/utils';
import type {
  Connect,
  ZabbixTemplate,
  ZabbixTemplateMetric,
} from 'api-generate';
import { useEffect, useRef } from 'react';
import type {
  AliyunMetric,
  DataSourceType,
  VolcengineMetric,
  WizardActions,
} from '../../../types';

// 定义 ZabbixMetric 类型别名
type ZabbixMetric = ZabbixTemplateMetric;

export interface UseMetricDataProps {
  dataSourceType: DataSourceType;
  connect: Connect;
  selectedTemplate?: ZabbixTemplate | null;
  zabbixMetrics: ZabbixMetric[];
  aliyunMetrics: AliyunMetric[];
  volcengineMetrics: VolcengineMetric[];
  loading: boolean;
  actions: WizardActions;
}

export const useMetricData = ({
  dataSourceType,
  connect,
  selectedTemplate,
  zabbixMetrics,
  aliyunMetrics,
  volcengineMetrics,
  loading,
  actions,
}: UseMetricDataProps) => {
  // 使用 useRef 来跟踪请求状态，防止重复请求
  const requestTracker = useRef<{
    zabbix: string | null;
    aliyun: string | null;
    volcengine: boolean;
  }>({
    zabbix: null,
    aliyun: null,
    volcengine: false,
  });

  // 使用 useEffect 来处理数据获取
  useEffect(() => {
    // ✅ 添加调试日志（使用 logger 替代 console）
    logger.debug({
      message: 'useMetricData effect triggered',
      data: {
        dataSourceType,
        connectName: connect?.name,
        hasTemplate: Boolean(selectedTemplate),
        metricsCount: zabbixMetrics.length,
        loading,
      },
      source: 'UseMetricData',
      component: 'effect',
    });

    // Zabbix 数据源处理
    if (
      dataSourceType === DataSource.type.ZABBIX &&
      connect?.name &&
      selectedTemplate?.templateid &&
      zabbixMetrics.length === 0 &&
      !loading
    ) {
      const requestKey = `${connect.name}-${selectedTemplate.templateid}`;

      // 检查是否已经发起过相同的请求
      if (requestTracker.current.zabbix !== requestKey) {
        requestTracker.current.zabbix = requestKey;
        actions.fetchZabbixMetrics(connect.name, selectedTemplate.templateid);
      }
    }

    // 阿里云数据源处理
    else if (
      dataSourceType === DataSource.type.ALIYUN &&
      connect?.name &&
      aliyunMetrics.length === 0 &&
      !loading
    ) {
      const requestKey = connect.name;

      if (requestTracker.current.aliyun !== requestKey) {
        requestTracker.current.aliyun = requestKey;
        actions.fetchAliyunMetrics((connect.id || connect._id)!);
      }
    }

    // 火山引擎数据源处理
    else if (
      dataSourceType === DataSource.type.VOLCENGINE &&
      volcengineMetrics.length === 0 &&
      !loading
    ) {
      if (!requestTracker.current.volcengine) {
        requestTracker.current.volcengine = true;
        actions.fetchVolcengineMetrics();
      }
    }
  }, [
    dataSourceType,
    connect?.name,
    selectedTemplate?.templateid,
    zabbixMetrics.length,
    aliyunMetrics.length,
    volcengineMetrics.length,
    loading,
    actions,
  ]);

  // 重置请求跟踪器当数据源类型或连接改变时
  useEffect(() => {
    requestTracker.current = {
      zabbix: null,
      aliyun: null,
      volcengine: false,
    };
  }, [dataSourceType, connect?.name]);

  return {
    requestTracker,
  };
};
