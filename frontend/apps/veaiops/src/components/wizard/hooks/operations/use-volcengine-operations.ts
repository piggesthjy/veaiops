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
 * 火山引擎数据源操作Hook
 * @description 管理火山引擎相关的API调用和状态更新
 * @author AI Assistant
 * @date 2025-01-16
 */

import apiClient from '@/utils/api-client';
import { Message } from '@arco-design/web-react';
import { API_RESPONSE_CODE } from '@veaiops/constants';

import type {
  VolcengineMetric as APIVolcengineMetric,
  VolcengineProduct as APIVolcengineProduct,
} from 'api-generate';
import { useCallback } from 'react';
import type {
  VolcengineInstance,
  VolcengineMetric,
  VolcengineProduct,
  WizardState,
} from '../../types';

// 火山引擎实例API响应类型
type APIVolcengineInstance = Record<string, string>;

export const useVolcengineOperations = (
  state: WizardState,
  setState: React.Dispatch<React.SetStateAction<WizardState>>,
  updateLoading: (key: keyof WizardState['loading'], value: boolean) => void,
) => {
  // 获取火山引擎产品列表
  const fetchVolcengineProducts = useCallback(async () => {
    updateLoading('products', true);
    try {
      const response =
        await apiClient.dataSources.getApisV1DatasourceVolcengineProducts();

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        // 转换API响应数据为组件需要的格式
        const products: VolcengineProduct[] = response.data.map(
          (item: APIVolcengineProduct) => ({
            namespace: item.namespace,
            name: item.description || item.namespace,
            description: item.description,
          }),
        );

        setState((prev) => ({
          ...prev,
          volcengine: { ...prev.volcengine, products },
        }));
      } else {
        throw new Error(response.message || '获取产品列表失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      Message.error('获取火山引擎产品失败，请重试');

      // 设置空数组作为fallback
      setState((prev) => ({
        ...prev,
        volcengine: { ...prev.volcengine, products: [] },
      }));
    } finally {
      updateLoading('products', false);
    }
  }, [setState, updateLoading]);

  // 设置选中的产品
  const setSelectedProduct = useCallback(
    (product: VolcengineProduct | null) => {
      setState((prev) => ({
        ...prev,
        volcengine: {
          ...prev.volcengine,
          selectedProduct: product,
          // 当选择新产品时，清空子命名空间相关数据
          subNamespaces: [],
          selectedSubNamespace: null,
          metrics: [],
          selectedMetric: null,
          instances: [],
          selectedInstances: [],
        },
      }));
    },
    [setState],
  );

  // 获取火山引擎子命名空间
  const fetchVolcengineSubNamespaces = useCallback(
    async (namespace: string) => {
      updateLoading('subNamespaces', true);
      try {
        const response =
          await apiClient.dataSources.getApisV1DatasourceVolcengineMetricsSubNamespaces(
            {
              namespace,
            },
          );

        if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
          setState((prev) => ({
            ...prev,
            volcengine: {
              ...prev.volcengine,
              subNamespaces: response.data || [],
            },
          }));
        } else {
          throw new Error(response.message || '获取子命名空间失败');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';

        Message.error('获取火山引擎子命名空间失败，请重试');

        // 设置空数组作为fallback
        setState((prev) => ({
          ...prev,
          volcengine: { ...prev.volcengine, subNamespaces: [] },
        }));
      } finally {
        updateLoading('subNamespaces', false);
      }
    },
    [setState, updateLoading],
  );

  // 设置选中的子命名空间
  const setSelectedSubNamespace = useCallback(
    (subNamespace: string | null) => {
      setState((prev) => ({
        ...prev,
        volcengine: {
          ...prev.volcengine,
          selectedSubNamespace: subNamespace,
          // 切换子命名空间时清除所有后续依赖数据
          metrics: [],
          selectedMetric: null,
          instances: [],
          selectedInstances: [],
          selectedGroupBy: [],
        },
      }));
    },
    [setState],
  );

  // 获取火山引擎指标列表
  const fetchVolcengineMetrics = useCallback(
    async (namespace?: string, subNamespace?: string) => {
      updateLoading('metrics', true);
      try {
        const response =
          await apiClient.dataSources.getApisV1DatasourceVolcengineMetricsSearch(
            {
              namespace,
              subNamespace,
            },
          );

        if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
          // 转换API响应数据为组件需要的格式
          const metrics: VolcengineMetric[] = response.data.map(
            (item: APIVolcengineMetric) => ({
              metricName: item.metric_name,
              namespace: item.namespace,
              subNamespace: item.sub_namespace,
              description: item.description,
              unit: item.unit,
            }),
          );

          setState((prev) => ({
            ...prev,
            volcengine: { ...prev.volcengine, metrics },
          }));
        } else {
          throw new Error(response.message || '获取指标列表失败');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';

        Message.error('获取火山引擎监控项失败，请重试');

        // 设置空数组作为fallback
        setState((prev) => ({
          ...prev,
          volcengine: { ...prev.volcengine, metrics: [] },
        }));
      } finally {
        updateLoading('metrics', false);
      }
    },
    [setState, updateLoading],
  );

  // 设置选中的监控项
  const setSelectedVolcengineMetric = useCallback(
    (metric: VolcengineMetric | null) => {
      setState((prev) => ({
        ...prev,
        volcengine: {
          ...prev.volcengine,
          selectedMetric: metric,
          // 切换监控项时清除实例和分组，防止数据不一致
          instances: [],
          selectedInstances: [],
          selectedGroupBy: [],
        },
      }));
    },
    [setState],
  );

  // 获取火山引擎实例列表
  const fetchVolcengineInstances = useCallback(
    async (
      connectName: string,
      region: string,
      namespace: string,
      subNamespace: string,
      metricName: string,
    ) => {
      updateLoading('instances', true);
      try {
        // 使用火山引擎API获取实例列表（POST 方法）
        const response =
          await apiClient.dataSources.postApisV1DatasourceVolcengineMetricsInstances(
            {
              requestBody: {
                connect_name: connectName,
                region,
                namespace,
                sub_namespace: subNamespace,
                metric_name: metricName,
              },
            },
          );

        if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
          // 转换API响应数据为组件需要的格式
          // 火山引擎返回的数据格式: [{"ResourceID": "i-xxx"}, {"ResourceID": "i-yyy"}]
          // 需要兼容多种可能的字段名
          const instances: VolcengineInstance[] =
            response.data?.map((item: APIVolcengineInstance) => {
              // 尝试从多个可能的字段获取实例ID
              const instanceId =
                item.ResourceID ||
                item.resource_id ||
                item.instance_id ||
                item.InstanceId ||
                item.instanceId ||
                'unknown';

              // 尝试从多个可能的字段获取实例名称
              const instanceName =
                item.ResourceName ||
                item.resource_name ||
                item.instance_name ||
                item.InstanceName ||
                item.instanceName ||
                instanceId;

              return {
                instanceId,
                instanceName,
                region: item.region || region, // 使用传入的 region
                namespace,
                subNamespace: subNamespace || '',
                dimensions: item,
              };
            }) || [];

          setState((prev) => ({
            ...prev,
            volcengine: { ...prev.volcengine, instances },
          }));
        } else {
          throw new Error(response.message || '获取实例列表失败');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';

        Message.error('获取火山引擎实例失败，请重试');

        // 设置空数组作为fallback
        setState((prev) => ({
          ...prev,
          volcengine: { ...prev.volcengine, instances: [] },
        }));
      } finally {
        updateLoading('instances', false);
      }
    },
    [setState, updateLoading],
  );

  // 设置可用实例列表（用于预填充）
  const setVolcengineInstances = useCallback(
    (instances: VolcengineInstance[]) => {
      setState((prev) => ({
        ...prev,
        volcengine: { ...prev.volcengine, instances },
      }));
    },
    [setState],
  );

  // 设置选中的实例
  const setSelectedVolcengineInstances = useCallback(
    (instances: VolcengineInstance[]) => {
      setState((prev) => ({
        ...prev,
        volcengine: { ...prev.volcengine, selectedInstances: instances },
      }));
    },
    [setState],
  );

  // 设置选中的分组维度
  const setSelectedVolcengineGroupBy = useCallback(
    (groupBy: string[]) => {
      setState((prev) => ({
        ...prev,
        volcengine: { ...prev.volcengine, selectedGroupBy: groupBy },
      }));
    },
    [setState],
  );

  // 设置区域
  const setVolcengineRegion = useCallback(
    (region: string) => {
      setState((prev) => ({
        ...prev,
        volcengine: { ...prev.volcengine, region },
      }));
    },
    [setState],
  );

  return {
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
  };
};
