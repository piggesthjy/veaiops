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
 * Data source utility functions
 */

import { DataSourceType } from 'api-generate';

import { formatDateTime } from '@veaiops/utils';

/**
 * Get data source display name
 */
export const getDataSourceDisplayName = (type: DataSourceType): string => {
  const displayNames: Record<DataSourceType, string> = {
    [DataSourceType.ZABBIX]: 'Zabbix',
    [DataSourceType.ALIYUN]: '阿里云',
    [DataSourceType.VOLCENGINE]: '火山引擎',
  };

  return displayNames[type] || type;
};

/**
 * Get data source description
 */
export const getDataSourceDescription = (type: DataSourceType): string => {
  const descriptions: Record<DataSourceType, string> = {
    [DataSourceType.ZABBIX]: '管理和配置 Zabbix 监控连接',
    [DataSourceType.ALIYUN]: '管理和配置阿里云监控连接',
    [DataSourceType.VOLCENGINE]: '管理和配置火山引擎监控连接',
  };

  return descriptions[type] || '数据源连接管理';
};

/**
 * maskSensitiveInfo parameter interface
 */
export interface MaskSensitiveInfoParams {
  info: string;
  visibleLength?: number;
}

/**
 * Mask sensitive information
 */
export const maskSensitiveInfo = ({
  info,
  visibleLength = 4,
}: MaskSensitiveInfoParams): string => {
  if (!info || info.length <= visibleLength) {
    return info;
  }

  const visible = info.slice(0, visibleLength);
  const masked = '*'.repeat(Math.min(info.length - visibleLength, 8));

  return `${visible}${masked}`;
};

/**
 * Get data source icon
 */
export const getDataSourceIcon = (type: DataSourceType): string => {
  const icons: Record<DataSourceType, string> = {
    [DataSourceType.ZABBIX]: 'icon-zabbix',
    [DataSourceType.ALIYUN]: 'icon-aliyun',
    [DataSourceType.VOLCENGINE]: 'icon-volcengine',
  };

  return icons[type] || 'icon-database';
};

/**
 * Validate connection configuration completeness
 */
export const validateConnectConfig = (
  type: DataSourceType,
  config: any,
): string[] => {
  const errors: string[] = [];

  if (!config.name || config.name.trim().length < 2) {
    errors.push('连接名称至少需要2个字符');
  }

  switch (type) {
    case DataSourceType.ZABBIX:
      if (!config.zabbix_api_url) {
        errors.push('请输入Zabbix API地址');
      } else if (!isValidUrl(config.zabbix_api_url)) {
        errors.push('请输入有效的API地址');
      }
      if (!config.zabbix_api_user) {
        errors.push('请输入API用户名');
      }
      if (!config.zabbix_api_password) {
        errors.push('请输入API密码');
      }
      break;
    case DataSourceType.ALIYUN:
      if (!config.aliyun_access_key_id) {
        errors.push('请输入Access Key ID');
      }
      if (!config.aliyun_access_key_secret) {
        errors.push('请输入Access Key Secret');
      }
      break;
    case DataSourceType.VOLCENGINE:
      if (!config.volcengine_access_key_id) {
        errors.push('请输入Access Key ID');
      }
      if (!config.volcengine_access_key_secret) {
        errors.push('请输入Access Key Secret');
      }
      break;
    default:
      errors.push('不支持的数据源类型');
      break;
  }

  return errors;
};

/**
 * Validate URL format
 *
 * Why use new URL():
 * - URL constructor is the standard method for validating URL format, no alternative
 * - Use try-catch wrapper to ensure type safety
 * - Although using new operator, it's only for validation, no actual side effects
 */
const isValidUrl = (url: string): boolean => {
  try {
    // URL constructor is the only standard method for validating URL
    // Note: Although using new operator, it's only for validation, no actual side effects
    const _url = new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get connection status label configuration
 */
export const getConnectionStatusConfig = (isActive: boolean) => {
  return {
    color: isActive ? 'green' : 'red',
    text: isActive ? '正常' : '禁用',
  };
};

/**
 * Format connection creation time
 * ✅ Use unified formatDateTime, supports timezone conversion
 */
export const formatConnectionTime = (timestamp: string): string => {
  return formatDateTime(timestamp, false); // false = do not show seconds
};

/**
 * Generate unique ID for connection test
 */
export const generateTestId = (): string => {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if connection name is duplicate
 */
export const checkDuplicateConnectionName = (
  name: string,
  connections: any[],
  excludeId?: string,
): boolean => {
  return connections.some(
    (conn) => conn.name === name && conn.id !== excludeId,
  );
};
