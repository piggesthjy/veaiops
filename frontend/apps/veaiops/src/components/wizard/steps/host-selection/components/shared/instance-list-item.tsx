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
 * 通用实例列表项组件
 *
 * 支持的数据源：
 * - 火山引擎 (Volcengine):
 *   - 后端接口: /apis/v1/datasource/volcengine/metrics/instances (POST)
 *   - 返回格式: [{"ResourceID": "i-xxx"}, ...]
 *   - 转换后: { id: ResourceID, name: ResourceName || ResourceID, region, namespace, subNamespace, dimensions }
 *
 * - 阿里云 (Aliyun):
 *   - 后端接口: /apis/v1/datasource/connect/aliyun/metrics/instances (POST)
 *   - 返回格式: [{"instanceId": "xxx", ...}, ...]
 *   - 转换后: { id: instanceId, name: instanceName || instanceId, region, dimensions }
 *
 * 注意：Zabbix 使用独立的 ZabbixHostListItem 组件，不使用此组件
 */

import { Space, Tag, Typography } from '@arco-design/web-react';
import { IconCloud, IconDesktop } from '@arco-design/web-react/icon';
import type React from 'react';
import { SelectableItem } from '../../../../components/selectable-item';

const { Text } = Typography;

/**
 * 实例数据接口
 * 统一的实例数据格式，用于在组件中渲染
 */
export interface InstanceData {
  /** 实例唯一标识 (来自 ResourceID/instanceId/instance_id 等字段) */
  id: string;
  /** 实例显示名称 (来自 ResourceName/instanceName/instance_name 等字段，如果没有则使用 id) */
  name?: string;
  /** 地域信息 (可选) */
  region?: string;
  /** 维度信息 (可选，阿里云使用) */
  dimensions?: Record<string, string>;
  /** 命名空间 (可选，火山引擎使用) */
  namespace?: string;
  /** 子命名空间 (可选，火山引擎使用) */
  subNamespace?: string;
  /** 其他扩展字段 */
  [key: string]: any;
}

/**
 * 获取实例的唯一标识
 *
 * 问题：同一 ResourceID 可能对应多个 DiskName（例如：i-xxx + vda1, i-xxx + vda2）
 * 解决方案：组合 id + DiskName + region + namespace + subNamespace 来生成唯一标识
 *
 * @param instance - 实例数据
 * @param index - 可选的索引（用于生成后备标识）
 * @returns 实例的唯一标识字符串
 */
export function getInstanceUniqueId(
  instance: InstanceData,
  index?: number,
): string {
  // 获取 DiskName，可能在 instance.DiskName 或 instance.dimensions.DiskName 中
  const diskNameValue =
    (instance as Record<string, unknown>).DiskName ||
    instance.dimensions?.DiskName;
  const diskName =
    typeof diskNameValue === 'string' ? diskNameValue : undefined;

  // 组合所有字段生成唯一标识
  const uniqueId = [
    instance.id || (index !== undefined ? `id-${index}` : ''),
    diskName,
    instance.region,
    instance.namespace,
    instance.subNamespace,
  ]
    .filter(Boolean)
    .join('-');

  return uniqueId || (index !== undefined ? `instance-${index}` : 'unknown');
}

/**
 * 比较两个实例是否相同（基于唯一标识）
 *
 * @param instance1 - 第一个实例
 * @param instance2 - 第二个实例
 * @returns 如果两个实例的唯一标识相同则返回 true
 */
export function areInstancesEqual(
  instance1: InstanceData,
  instance2: InstanceData,
): boolean {
  return getInstanceUniqueId(instance1) === getInstanceUniqueId(instance2);
}

export interface InstanceListItemProps {
  instance: InstanceData;
  isSelected: boolean;
  iconType?: 'cloud' | 'desktop';
  onToggle: (instance: InstanceData, checked: boolean) => void;
}

export const InstanceListItem: React.FC<InstanceListItemProps> = ({
  instance,
  isSelected,
  iconType = 'cloud',
  onToggle,
}) => {
  const handleClick = () => {
    onToggle(instance, !isSelected);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onToggle(instance, checked);
  };

  const Icon = iconType === 'cloud' ? IconCloud : IconDesktop;

  // 构建标题
  // 优先级：name > id > dimensions.instanceId > dimensions.userId
  // 当只有 userId 时，直接显示 userId 的值（与只有 instanceId 的情况一致）
  const displayId =
    instance.id ||
    instance.dimensions?.instanceId ||
    instance.dimensions?.userId ||
    '';
  const displayName =
    instance.name ||
    instance.id ||
    instance.dimensions?.instanceId ||
    instance.dimensions?.userId ||
    '未知实例';

  const title = (
    <Space>
      {displayName}
      {instance.region && <Tag color="blue">{instance.region}</Tag>}
    </Space>
  );

  // 构建描述
  const description = instance.namespace ? (
    <Text type="secondary" style={{ fontSize: 12 }}>
      命名空间: {instance.namespace}
      {instance.subNamespace && ` | 子命名空间: ${instance.subNamespace}`}
    </Text>
  ) : undefined;

  // 构建额外信息（维度）
  // 显示逻辑：
  // 1. 只显示 instanceId 和 userId 的标签，不显示实际值（避免与标题中的 ID 重复）
  // 2. 其他维度（如 DiskName）显示完整的 key: value
  // 3. 过滤掉已在标题中显示的 ResourceID
  const extra = (() => {
    if (!instance.dimensions || Object.keys(instance.dimensions).length === 0) {
      return undefined;
    }

    // 检查是否存在 instanceId 或 userId
    const instanceIdValue =
      instance.dimensions.instanceId ||
      instance.dimensions.InstanceId ||
      instance.dimensions.instance_id;
    const userIdValue = instance.dimensions.userId;

    // 构建维度标签列表
    const dimensionTags: React.ReactNode[] = [];

    // 如果有 instanceId，只显示标签（不显示值，避免与标题重复）
    if (instanceIdValue) {
      dimensionTags.push(
        <Tag key="instanceId" size="small" style={{ marginRight: 4 }}>
          instanceId
        </Tag>,
      );
    }

    // 如果有 userId，只显示标签（不显示值，避免与标题重复）
    if (userIdValue) {
      dimensionTags.push(
        <Tag key="userId" size="small" style={{ marginRight: 4 }}>
          userId
        </Tag>,
      );
    }

    // 其他维度（如 DiskName）显示完整的 key: value
    const otherDimensions = Object.entries(instance.dimensions).filter(
      ([key]) => {
        const normalizedKey = key.toLowerCase();
        return (
          normalizedKey !== 'resourceid' &&
          normalizedKey !== 'resource_id' &&
          normalizedKey !== 'instance_id' &&
          normalizedKey !== 'instanceid' &&
          normalizedKey !== 'userid' &&
          normalizedKey !== 'user_id'
        );
      },
    );

    otherDimensions.forEach(([key, value]) => {
      dimensionTags.push(
        <Tag key={key} size="small" style={{ marginRight: 4 }}>
          {key}: {value}
        </Tag>,
      );
    });

    if (dimensionTags.length === 0) {
      return undefined;
    }

    return (
      <div style={{ marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          维度: {dimensionTags}
        </Text>
      </div>
    );
  })();

  return (
    <SelectableItem
      selected={isSelected}
      onClick={handleClick}
      onCheckboxChange={handleCheckboxChange}
      selectorType="checkbox"
      icon={<Icon />}
      title={title}
      description={description}
      extra={extra}
    />
  );
};
