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

import { DataSource } from '@veaiops/api-client';
import type { Connect } from 'api-generate';
import type React from 'react';
import type { DataSourceType, WizardActions, WizardState } from '../../types';
import { AliyunMetricSelection } from './providers/aliyun';
import { VolcengineMetricSelection } from './providers/volcengine';
import { ZabbixMetricSelection } from './providers/zabbix';

export interface MetricSelectionStepProps {
  dataSourceType: DataSourceType;
  connect: Connect;
  actions: WizardActions;
  state: WizardState;
}

export const MetricSelectionStep: React.FC<MetricSelectionStepProps> = ({
  dataSourceType,
  connect,
  actions,
  state,
}) => {
  switch (dataSourceType) {
    case DataSource.type.ALIYUN:
      return (
        <AliyunMetricSelection
          metrics={state.aliyun.metrics}
          selectedMetric={state.aliyun.selectedMetric}
          loading={state.loading.metrics}
          searchText={state.aliyun.searchText}
          onSearchChange={actions.setAliyunSearchText}
          actions={actions}
          state={state}
        />
      );

    case DataSource.type.VOLCENGINE:
      return (
        <VolcengineMetricSelection
          metrics={state.volcengine.metrics}
          selectedMetric={state.volcengine.selectedMetric}
          loading={state.loading.metrics}
          searchText={state.volcengine.searchText}
          onSearchChange={actions.setVolcengineSearchText}
          actions={actions}
        />
      );

    case DataSource.type.ZABBIX:
      return (
        <ZabbixMetricSelection
          metrics={state.zabbix.metrics}
          selectedMetric={state.zabbix.selectedMetric}
          loading={state.loading.metrics}
          searchText={state.zabbix.searchText}
          onSearchChange={actions.setZabbixSearchText}
          actions={actions}
        />
      );

    default:
      return null;
  }
};
