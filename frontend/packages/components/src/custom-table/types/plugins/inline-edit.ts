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
 * 行内编辑插件类型定义
 * 基于 EPS 平台的可编辑表格能力和 Arco Table 类型系统
 */
import type { CSSProperties, ComponentType, Key, ReactNode } from 'react';
import type { BaseRecord } from '../core/common';
import type { PluginPriorityEnum } from '../core/enums';
import type { PluginBaseConfig } from './core';

/**
 * 编辑器类型
 */
export type EditorType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'date-picker'
  | 'number'
  | 'date'
  | 'switch'
  | 'custom';

/**
 * 编辑触发方式
 */
export type EditTrigger = 'click' | 'doubleClick' | 'focus' | 'manual';

/**
 * 编辑模式
 */
export type EditMode = 'cell' | 'row' | 'modal';

/**
 * 自定义编辑器组件属性（基于Arco Table渲染模式）
 */
export interface CustomEditorProps<RecordType extends BaseRecord = BaseRecord> {
  /** 当前值（来自record[dataIndex]） */
  value: unknown;
  /** 值变化回调 */
  onChange: (value: unknown) => void;
  /** 完成编辑回调 */
  onFinish: () => void;
  /** 取消编辑回调 */
  onCancel: () => void;
  /** 行数据 */
  record: RecordType;
  /** 字段名 */
  fieldName: string;
  /** 行索引 */
  rowIndex: number;
  /** 列索引 */
  columnIndex: number;
  /** 编辑器属性 */
  editorProps?: Record<string, unknown>;
}

/**
 * 编辑器选项
 */
export interface EditorOption {
  label: string;
  value: unknown;
  disabled?: boolean;
  [key: string]: unknown;
}

/**
 * 编辑器验证规则
 */
export interface EditorValidationRule<
  RecordType extends BaseRecord = BaseRecord,
> {
  required?: boolean;
  message?: string;
  validator?: (
    value: unknown,
    record: RecordType,
  ) => boolean | string | Promise<boolean | string>;
}

/**
 * 编辑器配置
 */
export interface EditorConfig<RecordType extends BaseRecord = BaseRecord> {
  /** 编辑器类型 */
  type: EditorType;
  /** 自定义编辑器组件 */
  component?: ComponentType<CustomEditorProps<RecordType>>;
  /** 编辑器属性 */
  props?: Record<string, unknown>;
  /** 选项数据（用于 select 类型） */
  options?:
    | EditorOption[]
    | ((record: RecordType) => EditorOption[] | Promise<EditorOption[]>);
  /** 验证规则 */
  rules?: EditorValidationRule<RecordType>[];
}

/**
 * 字段编辑配置
 */
export interface FieldEditConfig<RecordType extends BaseRecord = BaseRecord> {
  /** 字段名 */
  fieldName: string;
  /** 数据索引 */
  dataIndex: string;
  /** 是否可编辑 */
  editable: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 编辑器配置 */
  editor: EditorConfig<RecordType>;
  /** 是否必填 */
  required?: boolean;
  /** 验证函数 */
  validate?: (
    value: unknown,
    record: RecordType,
  ) => Promise<string | null> | string | null;
  /** 自定义渲染函数 */
  render?: (
    value: unknown,
    record: RecordType,
    editing: boolean,
    rowIndex: number,
  ) => ReactNode;
  /** 权限检查函数 */
  canEdit?: (
    record: RecordType,
    fieldName: string,
  ) => boolean | Promise<boolean>;
  /** 值格式化函数（显示时使用） */
  formatValue?: (value: unknown, record: RecordType) => unknown;
  /** 值解析函数（保存时使用） */
  parseValue?: (value: unknown, record: RecordType) => unknown;
  /** 编辑时的样式 */
  editingStyle?: CSSProperties;
  /** 编辑时的类名 */
  editingClassName?: string;
  /** 是否显示编辑图标 */
  showEditIcon?: boolean;
  /** Tab键确认编辑 */
  confirmOnTab?: boolean;
  /** 失焦时退出编辑 */
  exitOnBlur?: boolean;
}

/**
 * 编辑事件回调
 */
export interface EditEventCallbacks<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 开始编辑前 */
  beforeEdit?: (
    record: RecordType,
    fieldName: string,
    rowIndex: number,
  ) => boolean | Promise<boolean>;
  /** 开始编辑后 */
  afterEdit?: (record: RecordType, fieldName: string, rowIndex: number) => void;
  /** 保存前验证 */
  beforeSave?: (
    value: unknown,
    record: RecordType,
    fieldName: string,
    rowIndex: number,
  ) => boolean | Promise<boolean>;
  /** 保存后 */
  afterSave?: (
    newValue: unknown,
    oldValue: unknown,
    record: RecordType,
    fieldName: string,
    rowIndex: number,
  ) => void;
  /** 取消编辑 */
  onCancel?: (record: RecordType, fieldName: string, rowIndex: number) => void;
  /** 编辑出错 */
  onError?: (
    error: Error,
    record: RecordType,
    fieldName: string,
    rowIndex: number,
  ) => void;
  /** 值变化时 */
  onChange?: (
    value: unknown,
    record: RecordType,
    fieldName: string,
    rowIndex: number,
  ) => void;
}

/**
 * 行内编辑配置
 */
export interface InlineEditConfig<RecordType extends BaseRecord = BaseRecord>
  extends PluginBaseConfig {
  /** 编辑模式 */
  mode?: EditMode;
  /** 编辑触发方式 */
  trigger?: EditTrigger;
  /** 字段编辑配置 */
  fields?: FieldEditConfig<RecordType>[];
  /** 是否支持批量编辑 */
  batchEdit?: boolean;
  /** 是否允许批量编辑 */
  allowBatchEdit?: boolean;
  /** 自动保存延迟（毫秒） */
  autoSaveDelay?: number;
  /** 是否自动保存 */
  autoSave?: boolean;
  /** 是否在值变化时验证 */
  validateOnChange?: boolean;
  /** 编辑前回调 */
  onBeforeEdit?: (
    field: string,
    record: RecordType,
  ) => boolean | Promise<boolean>;
  /** 编辑后回调 */
  onAfterEdit?: (field: string, value: unknown, record: RecordType) => void;
  /** 取消编辑回调 */
  onEditCancel?: (field: string, record: RecordType) => void;
  /** 验证错误回调 */
  onValidationError?: (
    field: string,
    error: string,
    record: RecordType,
  ) => void;
  /** 保存回调 */
  onSave?: (field: string, value: unknown, record: RecordType) => Promise<void>;
  /** 编辑事件回调 */
  callbacks?: EditEventCallbacks<RecordType>;
  /** 获取行的唯一键 */
  getRowKey?: (record: RecordType) => Key;
  /** 样式配置 */
  style?: {
    editingClassName?: string;
    editingStyle?: CSSProperties;
    errorClassName?: string;
    errorStyle?: CSSProperties;
    cellEditingClassName?: string;
    rowEditingClassName?: string;
  };
}

/**
 * 编辑单元格信息
 */
export interface EditingCellInfo<RecordType extends BaseRecord = BaseRecord> {
  rowKey: Key;
  field: string;
  fieldName: string;
  rowIndex: number;
  columnIndex: number;
  originalValue: unknown;
  currentValue: unknown;
  record: RecordType;
}

/**
 * 编辑状态
 */
export interface EditState<RecordType extends BaseRecord = BaseRecord> {
  /** 正在编辑的单元格 */
  editingCells: Map<string, EditingCellInfo<RecordType>>;
  /** 正在编辑的行 */
  editingRows: Set<Key>;
  /** 编辑值缓存 key: rowKey_fieldName */
  editingValues: Map<string, unknown>;
  /** 编辑错误信息 key: rowKey_fieldName */
  editingErrors: Map<string, string>;
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
  /** 验证状态 */
  validationState: Map<string, boolean>;
  /** 原始值缓存（用于回退） */
  originalValues: Map<string, unknown>;
  /** 验证错误信息 */
  validationErrors: Map<string, string>;
  /** 是否有更改 */
  hasChanges: boolean;
  /** 是否有任何编辑中的状态 */
  isAnyEditing: boolean;
}

/**
 * 插件方法参数类型
 */
export interface StartEditParams {
  rowKey: Key;
  field: string;
}

export interface IsEditingParams {
  rowKey: Key;
  field?: string;
}

export interface GetEditingValueParams {
  rowKey: Key;
  field: string;
}

export interface SetEditingValueParams {
  rowKey: Key;
  field: string;
  value: unknown;
}

export interface GetEditingErrorsParams {
  rowKey?: Key;
  field?: string;
}

/**
 * 插件方法
 */
export interface InlineEditMethods<RecordType extends BaseRecord = BaseRecord> {
  /** 开始编辑指定单元格 */
  startEdit: (params: StartEditParams) => Promise<void>;
  /** 结束编辑指定单元格 */
  finishEdit: (value: unknown) => Promise<void>;
  /** 取消编辑指定单元格 */
  cancelEdit: () => void;
  /** 开始编辑整行 */
  startRowEdit: (rowKey: Key) => Promise<void>;
  /** 结束编辑整行 */
  finishRowEdit: (rowKey: Key) => Promise<boolean>;
  /** 取消编辑整行 */
  cancelRowEdit: (rowKey: Key) => void;
  /** 保存所有编辑 */
  saveAll: () => Promise<boolean>;
  /** 取消所有编辑 */
  cancelAll: () => void;
  /** 验证编辑内容 */
  validate: (params?: GetEditingErrorsParams) => Promise<boolean>;
  /** 获取编辑值 */
  getEditingValue: (params: GetEditingValueParams) => unknown;
  /** 设置编辑值 */
  setEditingValue: (params: SetEditingValueParams) => void;
  /** 检查单元格是否正在编辑 */
  isEditing: (params: IsEditingParams) => boolean;
  /** 获取所有编辑的数据 */
  getEditingData: () => Map<Key, Partial<RecordType>>;
  /** 获取编辑错误信息 */
  getEditingErrors: (params?: GetEditingErrorsParams) => string[];
  /** 开始批量编辑 */
  startBatchEdit: (rowKeys: Key[]) => Promise<void>;
  /** 获取字段编辑配置 */
  getFieldEditConfig: (field: string) => FieldEditConfig<RecordType> | null;
}
