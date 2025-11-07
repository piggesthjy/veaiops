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

import type { ConfigItem } from '../types/column-types';
import { getFieldTranslation } from './field-translation';

/**
 * 提取基本配置项
 */
const extractBasicConfigItems = (
  record: Record<string, unknown>,
): ConfigItem[] => {
  const configItems: ConfigItem[] = [];

  if (record.connect_name) {
    configItems.push({ configKey: 'connect_name', value: record.connect_name });
  }

  if (record.metric_name) {
    configItems.push({ configKey: 'metric_name', value: record.metric_name });
  }

  if (record.history_type !== undefined && record.history_type !== null) {
    configItems.push({ configKey: 'history_type', value: record.history_type });
  }

  return configItems;
};

/**
 * 提取数据源特定配置项
 */
const extractDataSourceConfigItems = (
  record: Record<string, unknown>,
): ConfigItem[] => {
  const configItems: ConfigItem[] = [];

  // 处理 Zabbix 配置
  if (record.zabbix_config && typeof record.zabbix_config === 'object') {
    Object.entries(record.zabbix_config).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const translationKey =
          key === 'targets' ? 'zabbix_targets' : `zabbix_${key}`;
        // 只添加有翻译的字段
        if (getFieldTranslation(translationKey)) {
          configItems.push({ configKey: translationKey, value });
        }
      }
    });
  }

  // 处理火山引擎配置
  if (
    record.volcengine_config &&
    typeof record.volcengine_config === 'object'
  ) {
    Object.entries(record.volcengine_config).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // 特殊处理 instances 字段
        const translationKey =
          key === 'instances' ? 'volcengine_instances' : `volcengine_${key}`;
        // 只添加有翻译的字段
        if (getFieldTranslation(translationKey)) {
          configItems.push({ configKey: translationKey, value });
        }
      }
    });
  }

  // 处理阿里云配置
  if (record.aliyun_config && typeof record.aliyun_config === 'object') {
    Object.entries(record.aliyun_config).forEach(([key, value]) => {
      // 跳过空值
      if (value === null || value === undefined || value === '') {
        return;
      }

      // 特殊处理 dimensions 字段，如果为空数组则跳过
      if (key === 'dimensions' && Array.isArray(value) && value.length === 0) {
        return;
      }

      // 构建翻译键：直接使用 aliyun_${key}
      const translationKey = `aliyun_${key}`;
      // 只添加有翻译的字段
      if (getFieldTranslation(translationKey)) {
        configItems.push({ configKey: translationKey, value });
      }
    });
  }

  // 处理通用 targets 字段
  if (record.targets) {
    const translationKey = 'targets';
    if (getFieldTranslation(translationKey)) {
      configItems.push({ configKey: translationKey, value: record.targets });
    }
  }

  // 处理通用 instances 字段
  if (record.instances) {
    const translationKey = 'instances';
    if (getFieldTranslation(translationKey)) {
      configItems.push({ configKey: translationKey, value: record.instances });
    }
  }

  return configItems;
};

/**
 * 提取所有配置项
 */
export const extractAllConfigItems = (
  record: Record<string, unknown>,
): ConfigItem[] => {
  const basicConfigItems = extractBasicConfigItems(record);
  const dataSourceConfigItems = extractDataSourceConfigItems(record);
  return [...basicConfigItems, ...dataSourceConfigItems];
};
