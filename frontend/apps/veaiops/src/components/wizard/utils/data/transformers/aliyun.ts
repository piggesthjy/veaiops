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
 * 阿里云数据转换工具
 * @description 处理阿里云API响应数据的格式转换
 * @author AI Assistant
 * @date 2025-01-16
 */

import type { AliyunInstance, AliyunMetric, AliyunProject } from '../../types';

/**
 * 转换项目数据
 */
export const transformProjectData = (rawData: any[]): AliyunProject[] => {
  return rawData.map((item: any) => ({
    project: item.Namespace || item.namespace || item.project || 'Unknown',
    description: item.Description || item.description || '',
    region: item.Region || item.region || '',
  }));
};

/**
 * 转换指标数据
 */
export const transformMetricData = (rawData: any[]): AliyunMetric[] => {
  return (
    rawData?.map?.((item: any) => ({
      metricName: item.MetricName,
      namespace: item.Namespace,
      description: item.Description,
      unit: item.Unit,
      dimensions: item.Dimensions || [],
      // 解析 Dimensions 字符串（逗号分隔）为数组
      dimensionKeys: item.Dimensions
        ? item.Dimensions.split(',')
            .map((d: string) => d.trim())
            .filter(Boolean)
        : [],
    })) || []
  );
};

/**
 * 转换实例数据
 *
 * 后端接口: /apis/v1/datasource/connect/aliyun/metrics/instances (POST)
 * 返回的数据格式：[{instanceId: "xxx", userId: "yyy"}, ...]
 * 每个对象本身就是 dimensions，需要提取 instanceId 等字段用于展示
 *
 * 字段兼容性说明：
 * - instanceId: 可能是 instanceId, InstanceId, instance_id
 * - instanceName: 可能是 instanceName, InstanceName, instance_name，如果没有则使用 instanceId
 * - region: 可能是 region, Region
 */
export const transformInstanceData = (rawData: unknown): AliyunInstance[] => {
  const dataArray = rawData as any[];

  if (!Array.isArray(dataArray)) {
    return [];
  }

  return dataArray.map((item: any) => {
    // 尝试从多个可能的字段获取实例ID
    // 当只有 userId 而没有 instanceId 时，使用 userId 作为 instanceId（用于兼容性）
    const instanceId =
      item.instanceId ||
      item.InstanceId ||
      item.instance_id ||
      item.userId || // 当只有 userId 时，使用 userId 作为 instanceId
      '';

    // 尝试从多个可能的字段获取实例名称，如果没有则使用 instanceId
    // 当只有 userId 时，使用 "userId: xxx" 格式作为名称
    const instanceName =
      item.instanceName ||
      item.InstanceName ||
      item.instance_name ||
      (item.userId && !item.instanceId
        ? `userId: ${item.userId}`
        : undefined) ||
      instanceId ||
      '';

    // 尝试从多个可能的字段获取区域
    const region = item.region || item.Region || '';

    return {
      instanceId,
      instanceName,
      region,
      // 整个 item 就是 dimensions，包含所有的维度信息
      dimensions: item,
    };
  });
};

/**
 * 获取模拟实例数据（用于API失败时的后备）
 */
export const getMockInstanceData = (): AliyunInstance[] => {
  return [];
};
