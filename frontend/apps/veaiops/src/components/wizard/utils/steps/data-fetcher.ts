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
 * 数据源向导步骤数据获取器
 * @description 处理向导步骤切换时的数据获取逻辑，为每个步骤加载必要的数据
 * @author AI Assistant
 * @date 2025-01-19
 */

import {
  createDataSource,
  updateDataSource,
} from '../../steps/create/components/datasource-creator';
import { DataSourceType } from '../../types';
import type { WizardActions, WizardState } from '../../types';

/**
 * 处理步骤切换时的数据获取逻辑
 * @param selectedType 选中的数据源类型
 * @param state 向导状态
 * @param actions 向导操作方法
 * @param currentStepKey 当前步骤的key
 * @returns Promise，对于创建步骤会返回创建结果
 */
export const handleStepDataFetch = async (
  selectedType: DataSourceType,
  state: WizardState,
  actions: WizardActions,
  currentStepKey: string,
): Promise<any> => {
  // 根据当前步骤执行相应的数据获取逻辑
  switch (currentStepKey) {
    case 'connect':
      await handleConnectStep(selectedType, state, actions);
      break;

    case 'template':
      await handleTemplateStep(selectedType, state, actions);
      break;

    case 'metric':
      await handleMetricStep(selectedType, state, actions);
      break;

    case 'project':
      await handleProjectStep(selectedType, state, actions);
      break;

    case 'product':
      // 火山引擎产品选择后，子命名空间由 SubnamespaceSelectionStep 组件自动获取
      // 不需要在这里调用 fetchVolcengineSubNamespaces，避免重复请求
      break;

    case 'subnamespace':
      await handleSubnamespaceStep(selectedType, state, actions);
      break;

    case 'instance':
      // 实例选择步骤 - 数据已在 metric 步骤获取，这里不需要额外操作
      break;

    case 'host':
      await handleHostStep(selectedType, state, actions);
      break;

    case 'create': {
      // 创建或更新数据源
      const result = await handleCreateStep(selectedType, state);
      return result;
    }

    default:
      break;
  }

  return undefined;
};

/**
 * 处理连接选择步骤
 */
async function handleConnectStep(
  selectedType: DataSourceType,
  state: WizardState,
  actions: WizardActions,
): Promise<void> {
  // 进入连接选择步骤时，首先获取连接列表
  if (!state.connects.length) {
    try {
      await actions.fetchConnects(selectedType);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(`获取${selectedType}连接列表失败: ${errorMessage}`);
    }
  }

  // 连接选择后的逻辑 - 只有在成功获取连接列表后才执行
  if (state.connects.length > 0) {
    try {
      if (selectedType === DataSourceType.ZABBIX && state.selectedConnect) {
        await actions.fetchZabbixTemplates(state.selectedConnect.name);
      } else if (
        selectedType === DataSourceType.ALIYUN &&
        state.selectedConnect
      ) {
        if (!state.selectedConnect._id) {
          throw new Error('阿里云连接缺少ID');
        }
        await actions.fetchAliyunProjects(state.selectedConnect._id);
      } else if (selectedType === DataSourceType.VOLCENGINE) {
        await actions.fetchVolcengineProducts();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(`初始化${selectedType}数据失败: ${errorMessage}`);
    }
  }
}

/**
 * 处理模板选择步骤（Zabbix）
 */
async function handleTemplateStep(
  selectedType: DataSourceType,
  state: WizardState,
  actions: WizardActions,
): Promise<void> {
  // Zabbix 模板选择后获取监控项
  if (
    selectedType === DataSourceType.ZABBIX &&
    state.selectedConnect &&
    state.zabbix.selectedTemplate
  ) {
    if (!state.zabbix.selectedTemplate.templateid) {
      throw new Error('Zabbix模板缺少templateid');
    }
    try {
      await actions.fetchZabbixMetrics(
        state.selectedConnect.name,
        state.zabbix.selectedTemplate.templateid,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(`获取Zabbix监控项失败: ${errorMessage}`);
    }
  }
}

/**
 * 处理监控项选择步骤
 */
async function handleMetricStep(
  selectedType: DataSourceType,
  state: WizardState,
  actions: WizardActions,
): Promise<void> {
  try {
    // Zabbix 监控项选择后获取主机列表
    if (
      selectedType === DataSourceType.ZABBIX &&
      state.selectedConnect &&
      state.zabbix.selectedTemplate &&
      state.zabbix.selectedMetric
    ) {
      await actions.fetchZabbixHosts(
        state.selectedConnect.name,
        state.zabbix.selectedTemplate.templateid,
      );
    }
    // 阿里云监控项选择后获取实例列表
    else if (
      selectedType === DataSourceType.ALIYUN &&
      state.selectedConnect &&
      state.aliyun.selectedMetric
    ) {
      if (
        !state.aliyun.selectedMetric.namespace ||
        !state.aliyun.selectedMetric.metricName
      ) {
        throw new Error('阿里云监控项信息不完整');
      }
      await actions.fetchAliyunInstances(
        state.selectedConnect.name,
        state.aliyun.selectedMetric.namespace,
        state.aliyun.selectedMetric.metricName,
      );
    }
    // 火山引擎监控项选择后获取实例列表
    else if (
      selectedType === DataSourceType.VOLCENGINE &&
      state.selectedConnect &&
      state.volcengine.selectedMetric &&
      state.volcengine.selectedProduct &&
      state.volcengine.selectedSubNamespace
    ) {
      if (!state.volcengine.region) {
        throw new Error('火山引擎地域未选择');
      }
      if (!state.volcengine.selectedProduct.namespace) {
        throw new Error('火山引擎产品命名空间未选择');
      }
      await actions.fetchVolcengineInstances(
        state.selectedConnect.name,
        state.volcengine.region,
        state.volcengine.selectedProduct.namespace,
        state.volcengine.selectedSubNamespace,
        state.volcengine.selectedMetric.metricName,
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw new Error(`获取${selectedType}实例列表失败: ${errorMessage}`);
  }
}

/**
 * 处理项目选择步骤（阿里云）
 */
async function handleProjectStep(
  selectedType: DataSourceType,
  state: WizardState,
  actions: WizardActions,
): Promise<void> {
  // 阿里云项目选择后获取监控项
  if (selectedType === DataSourceType.ALIYUN && state.selectedConnect) {
    if (!state.selectedConnect._id) {
      throw new Error('阿里云连接缺少ID');
    }
    try {
      await actions.fetchAliyunMetrics(state.selectedConnect._id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(`获取阿里云监控项失败: ${errorMessage}`);
    }
  }
}

/**
 * 处理子命名空间选择步骤（火山引擎）
 */
async function handleSubnamespaceStep(
  selectedType: DataSourceType,
  state: WizardState,
  actions: WizardActions,
): Promise<void> {
  // 火山引擎子命名空间选择后获取监控项
  if (selectedType === DataSourceType.VOLCENGINE) {
    if (!state.volcengine.selectedProduct?.namespace) {
      throw new Error('火山引擎产品命名空间未选择');
    }
    try {
      await actions.fetchVolcengineMetrics(
        state.volcengine.selectedProduct.namespace,
        state.volcengine.selectedSubNamespace || undefined,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(`获取火山引擎监控项失败: ${errorMessage}`);
    }
  }
}

/**
 * 处理主机选择步骤（Zabbix）
 */
async function handleHostStep(
  selectedType: DataSourceType,
  state: WizardState,
  actions: WizardActions,
): Promise<void> {
  // Zabbix 主机选择后获取监控项详情
  if (
    selectedType === DataSourceType.ZABBIX &&
    state.selectedConnect &&
    state.zabbix.selectedMetric &&
    state.zabbix.selectedHosts.length > 0
  ) {
    // 验证主机数据完整性
    const invalidHosts = state.zabbix.selectedHosts.filter(
      (host) => !host.host,
    );
    if (invalidHosts.length > 0) {
      throw new Error(`发现${invalidHosts.length}个无效主机（缺少host字段）`);
    }

    try {
      const promises = state.zabbix.selectedHosts.map((host) =>
        actions.fetchZabbixItems(
          state.selectedConnect!.name,
          host.host,
          state.zabbix.selectedMetric!.metric_name,
        ),
      );
      await Promise.all(promises);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(`获取Zabbix监控项详情失败: ${errorMessage}`);
    }
  }
}

/**
 * 处理创建步骤
 */
async function handleCreateStep(
  selectedType: DataSourceType,
  state: WizardState,
): Promise<any> {
  const isEditMode = Boolean(state.editingDataSourceId);

  const result = isEditMode
    ? await updateDataSource(selectedType, state.editingDataSourceId!, state)
    : await createDataSource(selectedType, state);

  if (!result.success) {
    throw new Error(
      result.message || (isEditMode ? '更新数据源失败' : '创建数据源失败'),
    );
  }

  return result;
}
