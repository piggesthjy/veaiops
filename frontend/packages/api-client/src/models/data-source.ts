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

/* generated using openapi-typescript-codegen -- do not edit */
import type { AliyunDataSourceConfig } from './aliyun-data-source-config';
import type { Connect } from './connect';
import type { VolcengineDataSourceConfig } from './volcengine-data-source-config';
import type { ZabbixDataSourceConfig } from './zabbix-data-source-config';
export type DataSource = {
  /**
   * 数据源ID
   */
  _id?: string;
  /**
   * 数据源名称
   */
  name: string;
  /**
   * 数据源类型
   */
  type: DataSource.type;
  /**
   * 数据源连接配置
   */
  connect: Connect;
  /**
   * 数据源配置
   */
  config?: Record<string, any>;
  /**
   * Zabbix数据源配置
   */
  zabbix_config?: ZabbixDataSourceConfig;
  /**
   * 阿里云数据源配置
   */
  aliyun_config?: AliyunDataSourceConfig;
  /**
   * 火山引擎数据源配置
   */
  volcengine_config?: VolcengineDataSourceConfig;
  /**
   * 数据源描述
   */
  description?: string;
  /**
   * 是否激活
   */
  is_active?: boolean;
  /**
   * 创建时间
   */
  created_at?: string;
  /**
   * 更新时间
   */
  updated_at?: string;
};
export namespace DataSource {
  /**
   * 数据源类型
   */
  export enum type {
    ZABBIX = 'zabbix',
    ALIYUN = 'aliyun',
    VOLCENGINE = 'volcengine',
  }
}
