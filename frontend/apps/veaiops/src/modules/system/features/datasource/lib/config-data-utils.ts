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

// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { DataSource, DataSourceType } from 'api-generate';

/**
 * 数据源记录扩展类型（包含特定配置字段）
 */
export type DataSourceWithConfigs = DataSource & {
  volcengine_config?: Record<string, unknown>;
  aliyun_config?: Record<string, unknown>;
  zabbix_config?: Record<string, unknown>;
};

/**
 * 根据数据源类型获取配置数据
 *
 * 为什么使用类型断言：
 * - DataSource 类型定义可能不包含特定数据源的配置字段（volcengine_config、aliyun_config、zabbix_config）
 * - 实际API返回的数据包含这些字段，但类型定义可能不完整
 * - 使用类型断言确保类型安全，运行时数据由API保证正确性
 *
 * TODO: 完善 api-generate 中的 DataSource 类型定义，添加可选配置字段
 *
 * @param record - 数据源记录
 * @param dsType - 数据源类型
 * @returns 配置数据对象
 */
export interface GetConfigDataParams {
  record: DataSource;
  dsType: DataSourceType;
}

export const getConfigData = ({
  record,
  dsType,
}: GetConfigDataParams): Record<string, unknown> | undefined => {
  // 使用类型断言，因为实际数据结构包含特定配置字段
  const recordWithConfigs = record as DataSourceWithConfigs;

  switch (dsType) {
    case 'Volcengine':
      return recordWithConfigs.volcengine_config;
    case 'Aliyun':
      return recordWithConfigs.aliyun_config;
    case 'Zabbix':
      return recordWithConfigs.zabbix_config;
    default:
      return record.config as Record<string, unknown> | undefined;
  }
};
