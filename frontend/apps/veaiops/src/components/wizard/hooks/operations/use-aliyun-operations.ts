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
 * 阿里云数据源操作Hook
 * @description 管理阿里云相关的API调用和状态更新
 * @author AI Assistant
 * @date 2025-01-16
 */

import { Message } from '@arco-design/web-react';
import { logger } from '@veaiops/utils';
import { useCallback } from 'react';
import {
  fetchAliyunInstancesAPI,
  fetchAliyunMetricsAPI,
  fetchAliyunProjectsAPI,
} from '../../services/aliyun-api';
import type { WizardState } from '../../types';
import {
  getMockInstanceData,
  transformInstanceData,
  transformMetricData,
  transformProjectData,
} from '../../utils/data/transformers/aliyun';
import { validateConnectIdWithMessage } from '../../utils/validation/aliyun-validators';
import { useAliyunState } from '../state/use-aliyun-state';

export const useAliyunOperations = (
  state: WizardState,
  setState: React.Dispatch<React.SetStateAction<WizardState>>,
  updateLoading: (key: keyof WizardState['loading'], value: boolean) => void,
) => {
  const {
    updateProjects,
    setSelectNamespace, // 重命名：setSelectedProject -> setSelectNamespace
    updateMetrics,
    setSelectedMetric,
    updateInstances,
    setSelectedInstances,
    setSelectedGroupBy,
    setRegion,
    clearProjectData,
    clearMetricData,
  } = useAliyunState(setState);

  // 获取阿里云项目列表
  const fetchAliyunProjects = useCallback(
    async (connectId: string) => {
      // 验证 connectId 格式
      const validation = validateConnectIdWithMessage(connectId);
      if (!validation.isValid) {
        Message.error(`连接ID格式无效：${validation.errorMessage}`);
        clearProjectData();
        return;
      }

      updateLoading('projects', true);
      try {
        const rawData = await fetchAliyunProjectsAPI(connectId);
        const projects = transformProjectData(rawData);
        updateProjects(projects);
      } catch (error) {
        Message.error('获取阿里云项目失败，请重试');
        clearProjectData();
      } finally {
        updateLoading('projects', false);
      }
    },
    [updateLoading, updateProjects, clearProjectData],
  );

  // 获取阿里云指标
  const fetchAliyunMetrics = useCallback(
    async (connectId: string) => {
      updateLoading('metrics', true);
      try {
        const namespace = state.aliyun.selectNamespace?.project;
        if (!namespace) {
          throw new Error('请先选择命名空间');
        }

        // region 提示：region 已在连接选择步骤输入
        // 参考文档：https://help.aliyun.com/document_detail/40654.html
        if (!state.aliyun.region) {
          // ✅ 注意：region 为空是允许的，会在后续步骤中提示用户输入
          // 在开发环境记录日志，便于调试
          logger.debug({
            message: 'Aliyun region not set, will prompt user in connect step',
            data: { namespace: state.aliyun.selectNamespace?.name },
            source: 'AliyunOperations',
            component: 'fetchAliyunMetrics',
          });
        }

        const rawData = await fetchAliyunMetricsAPI(connectId, namespace);

        const metrics = transformMetricData(rawData);
        updateMetrics(metrics);
      } catch (error) {
        Message.error('获取阿里云监控项失败，请重试');
        clearMetricData();
      } finally {
        updateLoading('metrics', false);
      }
    },
    [
      updateLoading,
      updateMetrics,
      clearMetricData,
      state.aliyun.selectNamespace,
    ],
  );

  // 获取阿里云实例
  const fetchAliyunInstances = useCallback(
    async (connectName: string, namespace: string, metricName: string) => {
      updateLoading('instances', true);
      try {
        // 从 state.aliyun.region 读取（用户在连接选择步骤输入）
        const { region } = state.aliyun;
        if (!region) {
          throw new Error('未选择有效地域，无法获取实例列表');
        }
        // 传递选中的 groupBy 维度
        const groupBy =
          state.aliyun.selectedGroupBy.length > 0
            ? state.aliyun.selectedGroupBy
            : undefined;
        const rawData = await fetchAliyunInstancesAPI(
          connectName,
          namespace,
          metricName,
          region,
          groupBy,
        );
        const instances = transformInstanceData(rawData);
        updateInstances(instances);
      } catch (error) {
        Message.error('获取阿里云实例失败，请重试');

        // 如果API失败，使用模拟数据作为后备
        const mockInstances = getMockInstanceData();
        updateInstances(mockInstances);
      } finally {
        updateLoading('instances', false);
      }
    },
    [
      updateLoading,
      updateInstances,
      state.aliyun.selectNamespace,
      state.aliyun.selectedGroupBy,
    ],
  );

  return {
    fetchAliyunProjects,
    setSelectNamespace, // 重命名：setSelectedProject -> setSelectNamespace
    fetchAliyunMetrics,
    setSelectedAliyunMetric: setSelectedMetric,
    fetchAliyunInstances,
    setSelectedAliyunInstances: setSelectedInstances,
    setSelectedGroupBy,
    setAliyunRegion: setRegion,
  };
};
