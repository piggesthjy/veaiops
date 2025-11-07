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
 * 步骤内容组件
 * @description 根据当前步骤渲染对应的内容组件
 * @author AI Assistant
 * @date 2025-01-15
 */

import { Spin } from '@arco-design/web-react';
import type { Connect } from 'api-generate';
import type React from 'react';
import styles from '../datasource-wizard.module.less';
import { ConfirmStep } from '../steps/confirm';
import { ConnectSelectionStep } from '../steps/connect-selection';
import { CreateStep } from '../steps/create';
import { InstanceSelectionStep } from '../steps/host-selection/components';
import { MetricSelectionStep } from '../steps/metric-selection';
import { NamespaceSelectionStep } from '../steps/namespace-selection';
import { ProductSelectionStep } from '../steps/product-selection';
import { SubnamespaceSelectionStep } from '../steps/subnamespace-selection';
import { TemplateSelectionStep } from '../steps/template-selection';
import {
  type DataSourceType,
  type WizardActions,
  type WizardState,
  WizardStep,
} from '../types';
import { getCurrentStepConfig } from '../utils/wizard-logic';

export interface StepContentProps {
  selectedType: DataSourceType | null;
  currentStep: number;
  state: WizardState;
  actions: WizardActions;
  connects?: Connect[];
}

export const StepContent: React.FC<StepContentProps> = ({
  selectedType,
  currentStep,
  state,
  actions,
}) => {
  if (!selectedType || currentStep < WizardStep.FIRST_STEP) {
    return null;
  }

  const currentStepConfig = getCurrentStepConfig(selectedType, currentStep);
  if (!currentStepConfig) {
    return (
      <div>
        <div className={styles.stepTitle}>配置错误</div>
        <div className={styles.stepDescription}>
          无法找到当前步骤的配置信息，请重新开始。
        </div>
      </div>
    );
  }

  return (
    <div id={`wizard-step-${currentStep}`} className={styles.stepContent}>
      <div className={styles.loadingWrapper}>
        <Spin loading={Object.values(state.loading).some(Boolean)} block>
          {currentStepConfig.key === 'connect' && (
            <ConnectSelectionStep
              connects={state.connects}
              selectedConnect={state.selectedConnect}
              actions={actions}
              state={state}
            />
          )}

          {/* 命名空间选择步骤 - 阿里云 */}
          {currentStepConfig.key === 'project' && state.selectedConnect && (
            <NamespaceSelectionStep
              connect={state.selectedConnect}
              projects={state.aliyun.projects}
              selectNamespace={state.aliyun.selectNamespace}
              loading={state.loading.projects}
              hasAttemptedFetch={state.aliyun.hasAttemptedFetch}
              actions={actions}
            />
          )}

          {/* 产品选择步骤 - 火山引擎 */}
          {currentStepConfig.key === 'product' && (
            <ProductSelectionStep
              products={state.volcengine.products}
              selectedProduct={state.volcengine.selectedProduct}
              loading={state.loading.products}
              onProductsFetch={actions.fetchVolcengineProducts}
              onProductSelect={actions.setSelectedProduct}
            />
          )}

          {currentStepConfig.key === 'subnamespace' && (
            <SubnamespaceSelectionStep
              selectedProduct={state.volcengine.selectedProduct}
              subNamespaces={state.volcengine.subNamespaces}
              selectedSubnamespace={state.volcengine.selectedSubNamespace}
              loading={state.loading.subNamespaces}
              onSubNamespacesFetch={actions.fetchVolcengineSubNamespaces}
              onSubnamespaceSelect={actions.setSelectedSubNamespace}
            />
          )}

          {/* 模版选择步骤 - Zabbix */}
          {currentStepConfig.key === 'template' && state.selectedConnect && (
            <TemplateSelectionStep
              connect={state.selectedConnect}
              templates={state.zabbix.templates}
              selectedTemplate={state.zabbix.selectedTemplate}
              loading={state.loading.templates}
              searchText={state.zabbix.searchText}
              onTemplatesFetch={actions.fetchZabbixTemplates}
              onTemplateSelect={actions.setSelectedTemplate}
              onSearchTextChange={actions.setZabbixSearchText}
            />
          )}

          {/* 指标选择步骤 */}
          {currentStepConfig.key === 'metric' && state.selectedConnect && (
            <MetricSelectionStep
              dataSourceType={selectedType}
              connect={state.selectedConnect}
              actions={actions}
              state={state}
            />
          )}

          {/* 主机选择步骤 */}
          {currentStepConfig.key === 'host' &&
            state.selectedConnect &&
            state.zabbix.selectedTemplate && (
              <InstanceSelectionStep
                dataSourceType={selectedType}
                connect={state.selectedConnect}
                selectedTemplate={state.zabbix.selectedTemplate}
                selectedZabbixMetric={state.zabbix.selectedMetric}
                zabbixHosts={state.zabbix.hosts}
                selectedZabbixHosts={state.zabbix.selectedHosts}
                selectedAliyunMetric={state.aliyun.selectedMetric}
                aliyunInstances={state.aliyun.instances}
                selectedAliyunInstances={state.aliyun.selectedInstances}
                selectedVolcengineMetric={state.volcengine.selectedMetric}
                volcengineInstances={state.volcengine.instances}
                selectedVolcengineInstances={state.volcengine.selectedInstances}
                loading={
                  state.loading.hosts || state.loading.instances || false
                }
                actions={actions}
                onZabbixHostSelect={actions.setSelectedHosts}
                onAliyunInstanceSelect={actions.setSelectedAliyunInstances}
                onVolcengineInstanceSelect={
                  actions.setSelectedVolcengineInstances
                }
              />
            )}

          {/* 实例选择步骤 */}
          {currentStepConfig.key === 'instance' && state.selectedConnect && (
            <InstanceSelectionStep
              dataSourceType={selectedType}
              connect={state.selectedConnect}
              selectedTemplate={state.zabbix.selectedTemplate}
              selectedZabbixMetric={state.zabbix.selectedMetric}
              zabbixHosts={state.zabbix.hosts}
              selectedZabbixHosts={state.zabbix.selectedHosts}
              selectedAliyunMetric={state.aliyun.selectedMetric}
              aliyunInstances={state.aliyun.instances}
              selectedAliyunInstances={state.aliyun.selectedInstances}
              selectedVolcengineMetric={state.volcengine.selectedMetric}
              volcengineInstances={state.volcengine.instances}
              selectedVolcengineInstances={state.volcengine.selectedInstances}
              loading={state.loading.hosts || state.loading.instances || false}
              actions={actions}
              onZabbixHostSelect={actions.setSelectedHosts}
              onAliyunInstanceSelect={actions.setSelectedAliyunInstances}
              onVolcengineInstanceSelect={
                actions.setSelectedVolcengineInstances
              }
            />
          )}

          {currentStepConfig.key === 'confirm' && selectedType && (
            <ConfirmStep dataSourceType={selectedType} state={state} />
          )}

          {currentStepConfig.key === 'create' && selectedType && (
            <CreateStep
              dataSourceType={selectedType}
              state={state}
              actions={actions}
            />
          )}
        </Spin>
      </div>
    </div>
  );
};

export default StepContent;
