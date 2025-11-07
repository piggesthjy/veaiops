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
 * 智能单元格插件类型定义
 * 基于 EPS 平台的智能空值处理能力
 */
import type { ReactNode } from 'react';
import type { BaseRecord } from '../core/common';
import type { PluginPriorityEnum } from '../core/enums';
import type { PluginBaseConfig } from './core';

/**
 * 空值展示策略
 */
export type EmptyValueStrategy =
  | 'text'
  | 'placeholder'
  | 'button'
  | 'icon'
  | 'contextual'
  | 'hide';

/**
 * 用户角色类型
 */
export type UserRole = 'admin' | 'editor' | 'viewer' | 'owner';

/**
 * 空值上下文信息
 */
export interface EmptyValueContext {
  /** 字段名 */
  fieldName: string;
  /** 实体类型 */
  entityType?: string;
  /** 用户角色 */
  userRole?: UserRole;
  /** 是否有权限 */
  hasPermission?: boolean;
  /** 是否必填 */
  isRequired?: boolean;
  /** 是否可编辑 */
  canEdit?: boolean;
  /** 相关数据 */
  relatedData?: BaseRecord;
  /** 自定义上下文 */
  [key: string]: unknown;
}

/**
 * 空值处理配置
 */
export interface EmptyValueConfig {
  /** 展示策略 */
  strategy?: EmptyValueStrategy;
  /** 显示文本 */
  text?: string;
  /** 图标 */
  icon?: ReactNode;
  /** 自定义组件 */
  component?: React.ComponentType<Record<string, unknown>>;
  /** 是否允许编辑 */
  allowEdit?: boolean;
  /** 是否显示提示 */
  showTooltip?: boolean;
  /** 提示内容 */
  tooltip?: string;
  /** 权限配置 */
  permission?: {
    hint?: string;
    allowedRoles?: UserRole[];
  };
  /** 点击事件 */
  onClick?: (params: Record<string, unknown>) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 交互提示文本 */
  interactiveText?: string;
  /** 自定义渲染函数 */
  customRender?: (context: EmptyValueContext) => ReactNode;
  /** 样式配置 */
  style?: {
    className?: string;
    style?: React.CSSProperties;
    interactiveClassName?: string;
    placeholderClassName?: string;
  };
}

/**
 * 字段权限配置
 */
export interface FieldPermissionConfig {
  /** 字段名 */
  fieldName: string;
  /** 只读字段列表 */
  readonlyFields?: string[];
  /** 敏感字段列表 */
  sensitiveFields?: string[];
  /** 必填字段列表 */
  requiredFields?: string[];
  /** 权限检查函数 */
  checkPermission?: (
    fieldName: string,
    record: BaseRecord,
    userRole?: UserRole,
  ) => boolean;
  /** 编辑权限检查函数 */
  canEdit?: (
    fieldName: string,
    record: BaseRecord,
    userRole?: UserRole,
  ) => boolean;
}

/**
 * 智能单元格配置
 */
export interface SmartCellConfig extends PluginBaseConfig {
  /** 默认空值配置 */
  defaultEmptyConfig?: EmptyValueConfig;
  /** 字段特定配置 */
  fieldConfigs?: Record<string, EmptyValueConfig>;
  /** 权限配置 */
  permissionConfig?: FieldPermissionConfig;
  /** 全局上下文 */
  globalContext?: Partial<EmptyValueContext>;
  /** 用户角色 */
  userRole?: UserRole;
  /** 是否显示权限提示 */
  showPermissionHints?: boolean;
  /** 是否启用上下文显示 */
  enableContextualDisplay?: boolean;
  /** 编辑回调 */
  onEdit?: (fieldName: string, record: BaseRecord) => Promise<boolean>;
  /** 空值点击回调 */
  onEmptyClick?: (
    fieldName: string,
    record: BaseRecord,
    context: EmptyValueContext,
  ) => void;
  /** 空值点击回调（扩展版） */
  onEmptyValueClick?: (params: Record<string, unknown>) => void;
  /** 单元格渲染回调 */
  onCellRender?: (
    params: CellRenderParams,
    fieldConfig: EmptyValueConfig,
    contextInfo: EmptyValueContext,
  ) => ReactNode | undefined;
}

/**
 * 单元格渲染参数
 */
export interface CellRenderParams<RecordType extends BaseRecord = BaseRecord> {
  /** 单元格值 */
  value: unknown;
  /** 行记录 */
  record: RecordType;
  /** 字段名 */
  field: string;
  /** 字段名（别名） */
  fieldName?: string;
  /** 是否为空值 */
  isEmpty?: boolean;
  /** 列索引 */
  columnIndex?: number;
  /** 行索引 */
  rowIndex?: number;
  /** 上下文信息 */
  context?: EmptyValueContext;
  /** 用户角色 */
  userRole?: UserRole;
}

/**
 * 智能单元格渲染函数
 */
export type SmartCellRenderer<RecordType extends BaseRecord = BaseRecord> = (
  params: CellRenderParams<RecordType>,
) => ReactNode;

/**
 * 插件状态
 */
export interface SmartCellState {
  /** 空值字段集合 */
  emptyFields?: Set<string>;
  /** 字段统计 */
  fieldStats?: Map<string, { total: number; empty: number }>;
  /** 总行数 */
  totalRows?: number;
  /** 用户角色 */
  userRole?: UserRole;
  /** 当前用户角色 */
  currentUserRole: UserRole;
  /** 字段权限映射 */
  fieldPermissions: Map<string, boolean>;
  /** 空值统计 */
  emptyValueStats: {
    totalEmptyCount: number;
    fieldEmptyCounts: Record<string, number>;
    interactiveEmptyCount: number;
  };
}

/**
 * 插件方法
 */
export interface SmartCellMethods<RecordType extends BaseRecord = BaseRecord> {
  /** 渲染智能单元格 */
  renderSmartCell: SmartCellRenderer<RecordType>;
  /** 检查字段权限 */
  checkFieldPermission: (fieldName: string, record: RecordType) => boolean;
  /** 检查编辑权限 */
  checkEditPermission: (fieldName: string, record: RecordType) => boolean;
  /** 获取空值配置 */
  getEmptyConfig: (fieldName: string) => EmptyValueConfig;
  /** 处理空值点击 */
  handleEmptyClick: (fieldName: string, record: RecordType) => void;
  /** 更新用户角色 */
  updateUserRole: (role: UserRole) => void;
  /** 获取空值统计 */
  getEmptyStats: () => SmartCellState['emptyValueStats'];
}
