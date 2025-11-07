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
 * 数据源连接管理类型定义
 */

import { FormInstance } from "@arco-design/web-react";
import type { Connect, DataSourceType } from "api-generate";

// 数据源连接面板Props
export interface DataSourceConnectionPanelProps {
  type: DataSourceType;
}

// 数据源连接表格Props
export interface DataSourceConnectionTableProps {
  type: DataSourceType;
  connects: Connect[];
  loading: boolean;
  selectedRowKeys?: string[];
  onSelectionChange?: (selectedRowKeys: string[]) => void;
  onRefresh: () => void;
  onEdit?: (connect: Connect) => void;
  onDelete?: (connect: Connect) => void;
  onTest?: (connect: Connect) => void;
  onCreateMonitor?: (connect: Connect) => void;
}

// 连接表单Props
export interface ConnectFormProps {
  type: DataSourceType;
  initialValues?: Partial<Connect>;
  onSubmit: (values: any) => Promise<boolean>;
  onCancel: () => void;
  form: FormInstance;
}

// 连接测试弹窗Props
export interface ConnectTestModalProps {
  visible: boolean;
  connect: Connect | null;
  onClose: () => void;
  externalTestResult?: TestResult;
  externalTesting?: boolean;
}

// 连接统计信息
export interface ConnectionStats {
  total: number;
  active: number;
  inactive: number;
}

// 全局连接统计
export interface GlobalConnectionStats {
  zabbix: ConnectionStats;
  aliyun: ConnectionStats;
  volcengine: ConnectionStats;
}

// 连接测试结果
export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

// 连接创建请求
export interface ConnectCreateRequest {
  name: string;
  type: DataSourceType;
  is_active?: boolean;
  // Zabbix 字段
  zabbix_api_url?: string;
  zabbix_api_user?: string;
  zabbix_api_password?: string;
  // 阿里云字段
  aliyun_access_key_id?: string;
  aliyun_access_key_secret?: string;
  // 火山引擎字段
  volcengine_access_key_id?: string;
  volcengine_access_key_secret?: string;
}

// 连接更新请求
export interface ConnectUpdateRequest {
  name?: string;
  is_active?: boolean;
  // Zabbix 字段
  zabbix_api_url?: string;
  zabbix_api_user?: string;
  zabbix_api_password?: string;
  // 阿里云字段
  aliyun_access_key_id?: string;
  aliyun_access_key_secret?: string;
  // 火山引擎字段
  volcengine_access_key_id?: string;
  volcengine_access_key_secret?: string;
}

// 页面组件Props
export interface ConnectionPageProps {
  className?: string;
}

// 表格列配置Props
export interface TableColumnsProps {
  type: DataSourceType;
  onEdit?: (connect: Connect) => void;
  onDelete?: (connect: Connect) => void;
  onTest?: (connect: Connect) => void;
  onCreateMonitor?: (connect: Connect) => void;
}

// 表格过滤器Props
export interface TableFiltersProps {
  type: DataSourceType;
  onFilter?: (filters: Record<string, any>) => void;
}
