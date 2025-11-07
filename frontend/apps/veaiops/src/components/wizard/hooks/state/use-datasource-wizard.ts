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
 * 数据源向导主Hook
 * @description 组合各个子Hook，提供统一的向导管理接口
 * @author AI Assistant
 * @date 2025-01-16
 */

import { useMemo } from 'react';
import type { WizardActions } from '../../types';
import { useDataSourceCreation } from '../creation/use-datasource-creation';
import { useAliyunOperations } from '../operations/use-aliyun-operations';
import { useConnectOperations } from '../operations/use-connect-operations';
import { useVolcengineOperations } from '../operations/use-volcengine-operations';
import { useZabbixOperations } from '../operations/use-zabbix-operations';
import { useAliyunState } from './use-aliyun-state';
import { useWizardState } from './use-wizard-state';

/**
 * 数据源向导主Hook
 * @description 整合所有子Hook，提供完整的向导功能
 */
export const useDataSourceWizard = () => {
  // 基础状态管理
  const {
    state,
    setState,
    setCurrentStep,
    setDataSourceType,
    setSelectedConnect,
    setDataSourceName,
    setDataSourceDescription,
    setEditingDataSourceId,
    resetWizard,
    updateLoading,
    setZabbixSearchText,
    setAliyunSearchText,
    setVolcengineSearchText,
  } = useWizardState();

  // 连接管理
  const { fetchConnects } = useConnectOperations(
    state,
    setState,
    updateLoading,
  );

  // Zabbix操作
  const {
    fetchZabbixTemplates,
    setSelectedTemplate,
    fetchZabbixMetrics,
    setSelectedMetric,
    fetchZabbixHosts,
    setSelectedHosts,
    fetchZabbixItems,
  } = useZabbixOperations(state, setState, updateLoading);

  // 阿里云操作
  const {
    fetchAliyunProjects,
    setSelectNamespace,
    fetchAliyunMetrics,
    setSelectedAliyunMetric,
    fetchAliyunInstances,
    setSelectedAliyunInstances,
    setSelectedGroupBy,
    setAliyunRegion,
  } = useAliyunOperations(state, setState, updateLoading);

  // 火山引擎操作
  const {
    fetchVolcengineProducts,
    setSelectedProduct,
    fetchVolcengineSubNamespaces,
    setSelectedSubNamespace,
    fetchVolcengineMetrics,
    setSelectedVolcengineMetric,
    fetchVolcengineInstances,
    setVolcengineInstances,
    setSelectedVolcengineInstances,
    setSelectedVolcengineGroupBy,
    setVolcengineRegion,
  } = useVolcengineOperations(state, setState, updateLoading);

  // 数据源创建
  const { createDataSource } = useDataSourceCreation(state, updateLoading);

  // 组合所有操作为统一的actions对象
  const actions: WizardActions = useMemo(
    () => ({
      // 基础操作
      setCurrentStep,
      setDataSourceType,
      setSelectedConnect,
      setDataSourceName,
      setDataSourceDescription,
      setEditingDataSourceId,
      resetWizard,

      // 连接操作
      fetchConnects,

      // Zabbix操作
      fetchZabbixTemplates,
      setSelectedTemplate,
      fetchZabbixMetrics,
      setSelectedMetric,
      fetchZabbixHosts,
      setSelectedHosts,
      fetchZabbixItems,
      setZabbixSearchText,

      // 阿里云操作
      fetchAliyunProjects,
      setSelectNamespace,
      fetchAliyunMetrics,
      setSelectedAliyunMetric,
      fetchAliyunInstances,
      setSelectedAliyunInstances,
      setSelectedGroupBy,
      setAliyunRegion,
      setAliyunSearchText,

      // 火山引擎操作
      fetchVolcengineProducts,
      setSelectedProduct,
      fetchVolcengineSubNamespaces,
      setSelectedSubNamespace,
      fetchVolcengineMetrics,
      setSelectedVolcengineMetric,
      fetchVolcengineInstances,
      setVolcengineInstances,
      setSelectedVolcengineInstances,
      setSelectedVolcengineGroupBy,
      setVolcengineRegion,
      setVolcengineSearchText,

      // 数据源创建
      createDataSource,
    }),
    [
      // 基础操作依赖
      setCurrentStep,
      setDataSourceType,
      setSelectedConnect,
      setDataSourceName,
      setDataSourceDescription,
      setEditingDataSourceId,
      resetWizard,

      // 连接操作依赖
      fetchConnects,

      // Zabbix操作依赖
      fetchZabbixTemplates,
      setSelectedTemplate,
      fetchZabbixMetrics,
      setSelectedMetric,
      fetchZabbixHosts,
      setSelectedHosts,
      fetchZabbixItems,
      setZabbixSearchText,

      // 阿里云操作依赖
      fetchAliyunProjects,
      setSelectNamespace,
      fetchAliyunMetrics,
      setSelectedAliyunMetric,
      fetchAliyunInstances,
      setSelectedAliyunInstances,
      setSelectedGroupBy,
      setAliyunRegion,
      setAliyunSearchText,

      // 火山引擎操作依赖
      fetchVolcengineProducts,
      setSelectedProduct,
      fetchVolcengineSubNamespaces,
      setSelectedSubNamespace,
      fetchVolcengineMetrics,
      setSelectedVolcengineMetric,
      fetchVolcengineInstances,
      setVolcengineInstances,
      setSelectedVolcengineInstances,
      setSelectedVolcengineGroupBy,
      setVolcengineRegion,
      setVolcengineSearchText,

      // 数据源创建依赖
      createDataSource,
    ],
  );

  return { state, actions };
};
