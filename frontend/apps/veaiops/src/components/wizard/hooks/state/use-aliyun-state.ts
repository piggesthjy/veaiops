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
 * 阿里云状态管理Hook
 * @description 管理阿里云相关的状态更新逻辑
 * @author AI Assistant
 * @date 2025-01-16
 */

import { useCallback } from 'react';
import type {
  AliyunInstance,
  AliyunMetric,
  AliyunProject,
  WizardState,
} from '../../types';

export const useAliyunState = (
  setState: React.Dispatch<React.SetStateAction<WizardState>>,
) => {
  // 更新项目列表
  const updateProjects = useCallback(
    (projects: AliyunProject[], hasAttemptedFetch = true) => {
      setState((prev) => ({
        ...prev,
        aliyun: { ...prev.aliyun, projects, hasAttemptedFetch },
      }));
    },
    [setState],
  );

  // 设置选中的命名空间（重命名：setSelectedProject -> setSelectNamespace）
  const setSelectNamespace = useCallback(
    (namespace: AliyunProject | null) => {
      setState((prev) => ({
        ...prev,
        aliyun: {
          ...prev.aliyun,
          selectNamespace: namespace,
          // 切换命名空间时清除所有后续依赖数据
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

  // 更新指标列表
  const updateMetrics = useCallback(
    (metrics: AliyunMetric[]) => {
      setState((prev) => ({
        ...prev,
        aliyun: { ...prev.aliyun, metrics },
      }));
    },
    [setState],
  );

  // 设置选中的指标
  const setSelectedMetric = useCallback(
    (metric: AliyunMetric | null) => {
      setState((prev) => ({
        ...prev,
        aliyun: {
          ...prev.aliyun,
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

  // 更新实例列表
  const updateInstances = useCallback(
    (instances: AliyunInstance[]) => {
      setState((prev) => ({
        ...prev,
        aliyun: { ...prev.aliyun, instances },
      }));
    },
    [setState],
  );

  // 设置选中的实例
  const setSelectedInstances = useCallback(
    (instances: AliyunInstance[]) => {
      setState((prev) => ({
        ...prev,
        aliyun: { ...prev.aliyun, selectedInstances: instances },
      }));
    },
    [setState],
  );

  // 设置选中的分组维度
  const setSelectedGroupBy = useCallback(
    (groupBy: string[]) => {
      setState((prev) => ({
        ...prev,
        aliyun: { ...prev.aliyun, selectedGroupBy: groupBy },
      }));
    },
    [setState],
  );

  // 设置Region（更新到 aliyun.region 独立字段）
  const setRegion = useCallback(
    (region: string) => {
      setState((prev) => ({
        ...prev,
        aliyun: {
          ...prev.aliyun,
          region, // 更新独立的 region 字段
        },
      }));
    },
    [setState],
  );

  // 清空项目相关数据
  const clearProjectData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      aliyun: {
        ...prev.aliyun,
        projects: [],
        selectNamespace: null, // 重命名：selectedProject -> selectNamespace
        hasAttemptedFetch: true,
      },
    }));
  }, [setState]);

  // 清空指标相关数据
  const clearMetricData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      aliyun: {
        ...prev.aliyun,
        metrics: [],
        selectedMetric: null,
      },
    }));
  }, [setState]);

  // 清空实例相关数据
  const clearInstanceData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      aliyun: {
        ...prev.aliyun,
        instances: [],
        selectedInstances: [],
      },
    }));
  }, [setState]);

  return {
    updateProjects,
    setSelectNamespace, // 重命名：setSelectedProject -> setSelectNamespace
    updateMetrics,
    setSelectedMetric,
    updateInstances,
    setSelectedInstances,
    setSelectedGroupBy,
    setRegion, // 更新独立的 aliyun.region 字段
    clearProjectData,
    clearMetricData,
    clearInstanceData,
  };
};
