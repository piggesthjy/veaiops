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
 * 监控介入相关类型定义
 */

// 从api-generate导入数据源类型
import type { DataSourceType as ApiDataSourceType } from "api-generate";

export interface MonitorIntervention {
  id: string;
  name: string;
  description?: string;
  monitor_type: "metric" | "log" | "trace" | "event";
  data_source: string;
  query_config: Record<string, unknown>;
  alert_rules: AlertRule[];
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface AlertRule {
  id: string;
  condition: string;
  threshold: number;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "ne";
  severity: "critical" | "warning" | "info";
  duration: number;
}

export interface MonitorInterventionTableData extends MonitorIntervention {
  key: string;
}

/**
 * 数据源类型（扩展版本，包含更多类型）
 */
export type DataSourceType = ApiDataSourceType | "prometheus" | "influxdb";

// 注意：DataSourceResponse 接口已在重构中移除
// 当前分支统一使用 api-generate 中的 DataSource 类型（符合单一数据源原则）
// 如果未来需要，应使用 api-generate/models/data-source.ts 中的类型定义

/**
 * 监控接入组件属性接口
 */
export interface MonitorAccessProps {
  moduleType?: "timeseries" | "threshold" | "common";
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 数据源接口（从injection模块迁移）
 */
export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  description?: string;
  status: "active" | "inactive" | "pending" | "error";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  config?: DataSourceConfig;
  endpoint?: string;
  auth_type?: string;
  metrics_count?: number;
  last_sync_time?: string;
}

export interface DataSourceConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  [key: string]: unknown;
}

/**
 * 删除处理函数类型
 *
 * ✅ 符合异步方法错误处理规范：
 * - 支持返回 { success: boolean; error?: Error } 格式的结果对象
 * - 同时也支持 Promise<void> 格式（向后兼容）
 */
export type DeleteHandler = (
  id: string,
) => Promise<boolean> | Promise<{ success: boolean; error?: Error }>;

/**
 * 编辑处理函数类型
 */
export type EditHandler = (item: DataSource) => void;

/**
 * 查看详情处理函数类型
 */
export type ViewHandler = (item: DataSource) => void;

/**
 * 监控项类型（别名，用于兼容旧代码）
 */
export type MonitorItem = DataSource;
