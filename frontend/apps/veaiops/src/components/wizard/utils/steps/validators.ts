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
 * 数据源向导步骤验证器
 * @description 处理向导各步骤的验证逻辑，判断是否可以进入下一步
 * @author AI Assistant
 * @date 2025-01-19
 */

import { DATA_SOURCE_CONFIGS } from '../../config/datasource-configs';
import { DataSourceType, WizardStep } from '../../types';
import type { WizardState } from '../../types';

/**
 * 检查当前步骤是否可以继续
 * @param selectedType 选中的数据源类型
 * @param state 向导状态
 * @returns 是否可以继续到下一步
 */
export const canProceed = (
  selectedType: DataSourceType | null,
  state: WizardState,
): boolean => {
  // 如果还没有选择数据源类型，不能继续
  if (!selectedType) {
    return false;
  }

  // 如果已选择数据源类型但还没有进入步骤流程，允许开始配置
  if (selectedType && state.currentStep === WizardStep.TYPE_SELECTION) {
    return true;
  }

  // 如果状态中的数据源类型与选中类型不匹配，但有选中类型，也允许继续
  if (selectedType && state.dataSourceType !== selectedType) {
    return true;
  }

  const config = DATA_SOURCE_CONFIGS.find((c) => c.type === selectedType);
  if (
    !config ||
    state.currentStep < WizardStep.FIRST_STEP ||
    state.currentStep >= config.steps.length
  ) {
    return Boolean(selectedType); // 如果选择了类型但步骤配置有问题，仍允许开始
  }

  const currentStepConfig = config.steps[state.currentStep];

  let result = false;
  let reason = '';

  switch (currentStepConfig.key) {
    case 'connect':
      result = Boolean(state.selectedConnect);
      reason = result ? '已选择连接' : '未选择连接';
      break;
    case 'template':
      result = Boolean(state.zabbix.selectedTemplate);
      reason = result ? '已选择模板' : '未选择模板';
      break;
    case 'project':
      result = Boolean(state.aliyun.selectNamespace);
      reason = result ? '已选择命名空间' : '未选择命名空间';
      break;
    case 'product':
      result = Boolean(state.volcengine.selectedProduct);
      reason = result ? '已选择产品' : '未选择产品';
      break;
    case 'subnamespace':
      result = Boolean(state.volcengine.selectedSubNamespace);
      reason = result ? '已选择子命名空间' : '未选择子命名空间';
      break;
    case 'metric':
      if (selectedType === DataSourceType.ZABBIX) {
        result = Boolean(state.zabbix.selectedMetric);
        reason = result ? '已选择Zabbix监控项' : '未选择Zabbix监控项';
      } else if (selectedType === DataSourceType.ALIYUN) {
        result = Boolean(state.aliyun.selectedMetric);
        reason = result ? '已选择阿里云监控项' : '未选择阿里云监控项';
      } else if (selectedType === DataSourceType.VOLCENGINE) {
        result = Boolean(state.volcengine.selectedMetric);
        reason = result ? '已选择火山引擎监控项' : '未选择火山引擎监控项';
      }
      break;
    case 'host':
      result = state.zabbix.selectedHosts.length > 0;
      reason = result ? '已选择主机' : '未选择主机';
      break;
    case 'instance':
      if (selectedType === DataSourceType.ALIYUN) {
        result = state.aliyun.selectedInstances.length > 0;
        reason = result ? '已选择阿里云实例' : '未选择阿里云实例';
      } else if (selectedType === DataSourceType.VOLCENGINE) {
        result = state.volcengine.selectedInstances.length > 0;
        reason = result ? '已选择火山引擎实例' : '未选择火山引擎实例';
      }
      break;
    case 'confirm':
      // 确认步骤总是允许进入下一步（创建步骤）
      result = true;
      reason = '配置确认完成，可以进入创建步骤';
      break;
    case 'create':
      // 创建步骤总是允许点击完成按钮，在点击时再进行校验
      result = true;
      reason = '可以点击完成按钮进行创建';
      break;
    default:
      result = false;
      reason = '未知步骤';
      break;
  }

  return result;
};
