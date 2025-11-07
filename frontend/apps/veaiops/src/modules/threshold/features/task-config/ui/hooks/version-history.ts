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

import apiClient from '@/utils/api-client';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import type { IntelligentThresholdTaskVersion } from 'api-generate';
import { useEffect, useState } from 'react';
import type { TaskVersionFiltersQuery } from '../version/filters';

/**
 * 版本历史管理 Hook
 */
export const useVersionHistory = (
  taskId: string | undefined,
  shouldFetch: boolean,
  filters?: TaskVersionFiltersQuery,
) => {
  const [versions, setVersions] = useState<IntelligentThresholdTaskVersion[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  /**
   * 获取任务版本历史
   */
  const fetchVersionHistory = async (
    id: string,
    filterParams?: TaskVersionFiltersQuery,
  ) => {
    try {
      setLoading(true);

      // 构建API请求参数
      const apiParams: Record<string, any> = {
        taskId: id,
        skip: 0,
        limit: 50,
      };

      // 添加筛选参数
      if (filterParams?.status) {
        apiParams.status = filterParams.status;
      }
      if (filterParams?.createdAtStart) {
        apiParams.createdAtStart = filterParams.createdAtStart;
      }
      if (filterParams?.createdAtEnd) {
        apiParams.createdAtEnd = filterParams.createdAtEnd;
      }
      if (filterParams?.updatedAtStart) {
        apiParams.updatedAtStart = filterParams.updatedAtStart;
      }
      if (filterParams?.updatedAtEnd) {
        apiParams.updatedAtEnd = filterParams.updatedAtEnd;
      }

      const response =
        await apiClient.intelligentThresholdTask.getApisV1IntelligentThresholdTaskVersions(
          apiParams as any, // 类型转换以匹配API接口
        );

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        setVersions(response.data);
      } else {
        setVersions([]);
      }
    } catch (error) {
      // 静默处理：获取版本历史失败时清空列表
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFetch && taskId) {
      fetchVersionHistory(taskId, filters);
    }
  }, [taskId, shouldFetch, filters]);

  return {
    versions,
    loading,
    refetch: taskId ? () => fetchVersionHistory(taskId, filters) : undefined,
  };
};
