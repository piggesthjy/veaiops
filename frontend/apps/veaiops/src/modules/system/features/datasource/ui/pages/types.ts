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

import type { DataSourceType } from 'api-generate';

/**
 * 数据源配置接口
 */
export interface DataSourceConfig {
  /** Tab 的唯一键 */
  key: string;
  /** 数据源类型 */
  type: DataSourceType;
  /** 删除处理器 */
  deleteHandler: (
    monitorId: string,
    dataSourceType?: DataSourceType,
  ) => Promise<boolean>;
  /** 表格 Ref 键名 */
  tableRefKey: 'volcengineTableRef' | 'aliyunTableRef' | 'zabbixTableRef';
}

/**
 * 表格 Ref 映射类型
 */
export interface TableRefMap {
  volcengineTableRef: React.RefObject<any>;
  aliyunTableRef: React.RefObject<any>;
  zabbixTableRef: React.RefObject<any>;
}
