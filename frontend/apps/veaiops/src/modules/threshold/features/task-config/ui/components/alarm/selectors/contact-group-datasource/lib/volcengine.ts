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
import type { DataSourceSetter } from './types';

/**
 * 获取 Volcengine 联系组数据源配置
 *
 * @param datasourceId - 数据源ID
 * @returns DataSourceSetter 配置对象
 */
export const getVolcengineContactGroupDataSource = (
  datasourceId: string,
): DataSourceSetter => ({
  serviceInstance: apiClient.dataSources,
  api: 'getApisV1DatasourceVolcengineContactGroups',
  payload: { datasourceId },
  responseEntityKey: 'data',
  optionCfg: {
    labelKey: 'name',
    valueKey: 'id',
  },
});

/**
 * 获取 Volcengine 告警方式数据源配置
 *
 * @param _datasourceId - 数据源ID
 * @returns DataSourceSetter 配置对象或undefined（使用静态选项）
 */
export const getVolcengineAlertMethodsDataSource = (
  _datasourceId: string,
) => {
  // Volcengine使用静态选项，不需要动态获取
  return undefined;
};
