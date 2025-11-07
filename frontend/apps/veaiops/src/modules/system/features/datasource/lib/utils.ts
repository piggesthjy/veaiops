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
 * Monitor data source management utility functions
 */

import { formatDateTime as formatDateTimeUtils, logger } from '@veaiops/utils';
import type { DataSource } from "api-generate";
import { MODULE_CONFIG } from "./constants";
import { DataSourceType, MonitorItem } from "./types";

/**
 * Transform API response data to MonitorItem format
 */
export const transformDataSourceToMonitorItem = (
  ds: DataSource,
  type: DataSourceType
): MonitorItem => {
  let description = "";

  switch (type) {
    case "Zabbix":
      description = `Zabbix数据源 - ${ds.zabbix_config?.metric_name || ""}`;
      break;
    case "Aliyun":
      description = `阿里云数据源 - ${ds.aliyun_config?.namespace || ""}`;
      break;
    case "Volcengine":
      description = `火山引擎数据源 - ${ds.volcengine_config?.namespace || ""}`;
      break;
    default:
      description = `${type}数据源`;
  }

  return {
    id: ds._id || "",
    name: ds.name || "",
    description,
    type,
    status: ds.is_active ? "active" : "inactive",
    is_active: ds.is_active ?? false,
    created_at: ds.created_at,
    updated_at: ds.updated_at,
  };
};

/**
 * Get configuration based on module type
 */
export const getModuleConfig = (
  moduleType: "timeseries" | "threshold" | "common"
) => {
  return MODULE_CONFIG[moduleType] || MODULE_CONFIG.common;
};

/**
 * Detect module type
 */
export const detectModuleType = (): "timeseries" | "threshold" | "common" => {
  const { pathname } = window.location;

  if (pathname.includes("/timeseries/")) {
    return "timeseries";
  }
  if (pathname.includes("/threshold/")) {
    return "threshold";
  }

  return "common";
};

/**
 * Format datetime display
 *
 * Uses unified formatDateTime from @veaiops/utils for consistent timezone conversion
 * This function is kept for backward compatibility, but delegates to the unified function
 */
export const formatDateTime = (dateString?: string): string => {
  // Use unified formatDateTime from @veaiops/utils
  return formatDateTimeUtils(dateString, true);
};

/**
 * Generate error log object
 */
export const createErrorLog = (
  component: string,
  operation: string,
  error: Error,
  context?: Record<string, unknown>
) => ({
  error: error.message,
  timestamp: Date.now(),
  component,
  operation,
  ...context,
});

/**
 * Get supported module types
 */
export const getSupportedModuleType = (
  moduleType: string
): "timeseries" | "threshold" | "common" => {
  if (moduleType === "timeseries" || moduleType === "threshold") {
    return moduleType;
  }
  return "common";
};

/**
 * Transform monitor data to table data
 */
export const transformMonitorToTableData = (item: MonitorItem) => {
  return {
    ...item,
    key: item.id,
  };
};

/**
 * Format monitor time display
 */
export const formatMonitorDateTime = (dateString?: string): string => {
  return formatDateTime(dateString);
};
