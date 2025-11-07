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
 * 数据源类型常量
 */
export const DATASOURCE_TYPES = {
  VOLCENGINE: 'Volcengine',
  ALIYUN: 'Aliyun',
  ZABBIX: 'Zabbix',
} as const;

/**
 * 数据源类型配置（包含翻译和样式）
 */
export const DATA_SOURCE_CONFIG = {
  Zabbix: {
    label: 'Zabbix',
    color: 'blue',
    iconColor: '#1890ff',
  },
  Aliyun: {
    label: '阿里云',
    color: 'orange',
    iconColor: '#fa8c16',
  },
  Volcengine: {
    label: '火山引擎',
    color: 'purple',
    iconColor: '#722ed1',
  },
} as const;

/**
 * 数据源类型选项（用于下拉选择等）
 */
export const DATA_SOURCE_OPTIONS = [
  { label: 'Zabbix', value: 'Zabbix' },
  { label: '阿里云', value: 'Aliyun' },
  { label: '火山引擎', value: 'Volcengine' },
] as const;

/**
 * 数据源类型映射（用于快速查找翻译）
 */
export const DATA_SOURCE_LABELS = {
  Zabbix: 'Zabbix',
  Aliyun: '阿里云',
  Volcengine: '火山引擎',
} as const;

/**
 * 获取数据源类型的中文标签
 */
export function getDataSourceLabel(type: string): string {
  return DATA_SOURCE_LABELS[type as keyof typeof DATA_SOURCE_LABELS] || type;
}

/**
 * 获取数据源类型配置
 */
export function getDataSourceConfig(type: string) {
  return (
    DATA_SOURCE_CONFIG[type as keyof typeof DATA_SOURCE_CONFIG] || {
      label: type,
      color: 'default',
      iconColor: '#666666',
    }
  );
}
