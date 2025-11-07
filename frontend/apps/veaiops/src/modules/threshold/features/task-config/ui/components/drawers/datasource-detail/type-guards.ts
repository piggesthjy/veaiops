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

import { DataSourceType } from '@veaiops/api-client';

/**
 * 类型守卫：判断数据源类型是否为火山引擎
 */
export const isVolcengineType = (type: unknown): boolean => {
  return type === DataSourceType.VOLCENGINE;
};

/**
 * 类型守卫：判断数据源类型是否为阿里云
 */
export const isAliyunType = (type: unknown): boolean => {
  return type === DataSourceType.ALIYUN;
};

/**
 * 类型守卫：判断数据源类型是否为 Zabbix
 */
export const isZabbixType = (type: unknown): boolean => {
  return type === DataSourceType.ZABBIX;
};
