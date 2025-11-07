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
 * 数据预填充工具函数
 * @description 在编辑模式下，从现有数据源中提取配置并预填充到向导状态
 */

import type {
  AliyunDataSourceConfig,
  VolcengineDataSourceConfig,
  ZabbixDataSourceConfig,
} from 'api-generate';
import {
  DataSourceType,
  type WizardActions,
  type WizardState,
} from '../../types';

/**
 * 预填充 Zabbix 数据源配置
 */
export const prefillZabbixData = async (
  config: ZabbixDataSourceConfig,
  actions: WizardActions,
  state: WizardState,
) => {
  try {
    // 预填充连接
    if (config.connect_name && state.connects.length > 0) {
      const connect = state.connects.find(
        (c) => c.name === config.connect_name,
      );
      if (connect) {
        actions.setSelectedConnect(connect);
      }
      // Connect not found, skip setting
    }
    // No connect_name or no connects available, skip

    // 预填充监控项名称（作为选中的 metric）
    if (config.metric_name) {
      actions.setSelectedMetric({
        metric_name: config.metric_name,
        name: config.metric_name,
        key_: '',
        itemid: '',
      });
    }

    // 预填充主机列表（从 targets 中提取，同时保留 itemid）
    if (config.targets && config.targets.length > 0) {
      const hosts = config.targets.map((target, index) => ({
        name: target.hostname || `主机 ${index + 1}`,
        host: target.hostname || '',
        // 保留 itemid，以便编辑时能够正确重建 targets
        itemid: target.itemid,
      }));
      actions.setSelectedHosts(hosts);
    }
  } catch (error) {}
};

/**
 * 预填充阿里云数据源配置
 */
export const prefillAliyunData = async (
  config: AliyunDataSourceConfig,
  actions: WizardActions,
  state: WizardState,
) => {
  try {
    // 预填充连接
    if (config.connect_name && state.connects.length > 0) {
      const connect = state.connects.find(
        (c) => c.name === config.connect_name,
      );
      if (connect) {
        actions.setSelectedConnect(connect);

        // 预填充项目（使用 namespace 作为 project）
        if (config.namespace) {
          actions.setSelectNamespace({
            project: config.namespace,
            region: config.region,
          });
        }

        // 预填充 region 到 state（用于 Region 输入框回显）
        if (config.region) {
          actions.setAliyunRegion(config.region);
        }
      }
      // Connect not found, skip setting
    }
    // No connect_name or no connects available, skip

    // 预填充监控项
    if (config.metric_name && config.namespace) {
      actions.setSelectedAliyunMetric({
        metricName: config.metric_name,
        namespace: config.namespace,
        description: '',
      });
    }

    // 预填充实例（从 dimensions 中提取）
    if (config.dimensions && config.dimensions.length > 0) {
      const instances = config.dimensions.map((dim, index) => ({
        instanceId: dim.InstanceId || dim.instanceId || `instance-${index}`,
        instanceName:
          dim.InstanceName ||
          dim.instanceName ||
          dim.InstanceId ||
          dim.instanceId ||
          `实例 ${index + 1}`,
        dimensions: dim,
      }));
      actions.setSelectedAliyunInstances(instances);
    }
  } catch (error) {}
};

/**
 * 预填充火山引擎数据源配置
 */
export const prefillVolcengineData = async (
  config: VolcengineDataSourceConfig,
  actions: WizardActions,
  state: WizardState,
) => {
  try {
    // 边界情况：config 为空
    if (!config) {
      return;
    }

    // 预填充连接
    if (config.connect_name && state.connects && state.connects.length > 0) {
      const connect = state.connects.find(
        (c) => c.name === config.connect_name,
      );
      if (connect) {
        actions.setSelectedConnect(connect);
      }
    }

    // 预填充 region - 边界情况：空字符串不设置
    if (config.region?.trim()) {
      actions.setVolcengineRegion(config.region);
    }

    // 预填充产品（使用 namespace 创建产品对象）
    if (config.namespace?.trim()) {
      actions.setSelectedProduct({
        namespace: config.namespace,
        name: config.namespace,
      });
    }

    // 预填充子命名空间 - 边界情况：空字符串不设置
    if (config.sub_namespace?.trim()) {
      actions.setSelectedSubNamespace(config.sub_namespace);
    }

    // 预填充监控项
    if (
      config.metric_name?.trim() &&
      config.namespace &&
      config.namespace.trim()
    ) {
      actions.setSelectedVolcengineMetric({
        metricName: config.metric_name,
        namespace: config.namespace,
        subNamespace: config.sub_namespace,
        unit: '',
      });
    }

    // 预填充实例列表
    if (
      config.instances &&
      Array.isArray(config.instances) &&
      config.instances.length > 0
    ) {
      const instances = config.instances
        .filter(
          (dimensionsObj) => dimensionsObj && typeof dimensionsObj === 'object',
        ) // 过滤掉 null/undefined
        .map((dimensionsObj, index) => {
          // 从 dimensions 对象中尝试提取实例ID和名称
          const instanceId =
            dimensionsObj.ResourceID ||
            dimensionsObj.resource_id ||
            dimensionsObj.instance_id ||
            dimensionsObj.InstanceId ||
            dimensionsObj.instanceId ||
            `instance-${index}`;

          const instanceName =
            dimensionsObj.ResourceName ||
            dimensionsObj.resource_name ||
            dimensionsObj.instance_name ||
            dimensionsObj.InstanceName ||
            dimensionsObj.instanceName ||
            instanceId;

          return {
            instanceId,
            instanceName,
            region: config.region || '',
            namespace: config.namespace || '',
            subNamespace: config.sub_namespace || '',
            dimensions: dimensionsObj,
          };
        });

      // 边界情况：过滤后可能为空数组
      if (instances.length > 0) {
        // 同时设置可用实例列表和已选实例列表
        // 在编辑模式下，将已选实例同时作为可用实例列表显示
        // 这样用户可以看到已选的实例，并且可以取消选择
        actions.setVolcengineInstances(instances);
        actions.setSelectedVolcengineInstances(instances);
      }
    }
  } catch (error) {
    // prefillVolcengineData error
  }
};

/**
 * 预填充数据源配置（统一入口）
 */
export const prefillDataSourceConfig = async (
  dataSource: any,
  actions: WizardActions,
  state: WizardState,
) => {
  if (!dataSource) {
    return;
  }

  // 将类型转换为小写以匹配 DataSourceType 枚举值
  const dataSourceType = dataSource.type?.toLowerCase() as DataSourceType;

  // 根据数据源类型获取对应的配置对象
  let config: any = null;
  switch (dataSourceType) {
    case DataSourceType.ZABBIX:
      config = dataSource.zabbix_config || dataSource.config;
      break;
    case DataSourceType.ALIYUN:
      config = dataSource.aliyun_config || dataSource.config;
      break;
    case DataSourceType.VOLCENGINE:
      config = dataSource.volcengine_config || dataSource.config;
      break;
    default:
      break;
  }

  if (!config) {
    return;
  }

  switch (dataSourceType) {
    case DataSourceType.ZABBIX:
      await prefillZabbixData(config as ZabbixDataSourceConfig, actions, state);
      break;
    case DataSourceType.ALIYUN:
      await prefillAliyunData(config as AliyunDataSourceConfig, actions, state);
      break;
    case DataSourceType.VOLCENGINE:
      await prefillVolcengineData(
        config as VolcengineDataSourceConfig,
        actions,
        state,
      );
      break;
    default:
  }
};
