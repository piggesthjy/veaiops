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
 * 增强的行回调属性类型定义
 * 基于 Arco Design Table RowCallbackProps 扩展
 */

import type { ReactNode } from 'react';
import type { BaseRecord } from '../core/common';

/**
 * 原始行回调属性（基于 Arco Design Table）
 */
export interface RowCallbackProps {
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
  onHandleSave?: (row: BaseRecord) => void;
  [name: string]: unknown;
}

/**
 * 增强的行回调属性
 * 提供更丰富的行交互能力
 */
export interface EnhancedRowCallbackProps<
  RecordType extends BaseRecord = BaseRecord,
> extends RowCallbackProps {
  /** 行数据 */
  record?: RecordType;
  /** 行索引 */
  index?: number;
  /** 是否选中 */
  selected?: boolean;
  /** 是否展开 */
  expanded?: boolean;
  /** 行状态 */
  rowState?: {
    loading?: boolean;
    error?: boolean;
    disabled?: boolean;
    highlighted?: boolean;
  };

  // === 扩展事件回调 ===
  /** 行聚焦回调 */
  onFocus?: (
    event: React.FocusEvent,
    record: RecordType,
    index: number,
  ) => void;
  /** 行失焦回调 */
  onBlur?: (event: React.FocusEvent, record: RecordType, index: number) => void;
  /** 行键盘事件回调 */
  onKeyDown?: (
    event: React.KeyboardEvent,
    record: RecordType,
    index: number,
  ) => void;
  /** 行拖拽开始回调 */
  onDragStart?: (
    event: React.DragEvent,
    record: RecordType,
    index: number,
  ) => void;
  /** 行拖拽结束回调 */
  onDragEnd?: (
    event: React.DragEvent,
    record: RecordType,
    index: number,
  ) => void;
  /** 行放置回调 */
  onDrop?: (event: React.DragEvent, record: RecordType, index: number) => void;

  // === 业务扩展回调 ===
  /** 行编辑保存回调 */
  onSave?: (
    record: RecordType,
    changes: Partial<RecordType>,
  ) => Promise<boolean>;
  /** 行编辑取消回调 */
  onCancel?: (record: RecordType) => void;
  /** 行删除回调 */
  onDelete?: (record: RecordType, index: number) => Promise<boolean>;
  /** 行复制回调 */
  onCopy?: (record: RecordType, index: number) => void;
  /** 行详情查看回调 */
  onViewDetails?: (record: RecordType, index: number) => void;

  // === 样式和渲染相关 ===
  /** 自定义行类名 */
  className?: string | ((record: RecordType, index: number) => string);
  /** 自定义行样式 */
  style?:
    | React.CSSProperties
    | ((record: RecordType, index: number) => React.CSSProperties);
  /** 行提示信息 */
  title?: string | ((record: RecordType, index: number) => string);
  /** 行图标 */
  icon?: ReactNode | ((record: RecordType, index: number) => ReactNode);
}

/**
 * 行回调配置
 */
export interface RowCallbackConfig<RecordType extends BaseRecord = BaseRecord> {
  /** 是否启用行回调增强 */
  enabled?: boolean;
  /** 默认行回调属性 */
  defaultProps?: Partial<EnhancedRowCallbackProps<RecordType>>;
  /** 行回调生成函数 */
  getRowProps?: (
    record: RecordType,
    index: number,
  ) => EnhancedRowCallbackProps<RecordType>;
  /** 全局行事件处理器 */
  globalHandlers?: {
    onClick?: (record: RecordType, index: number) => void;
    onDoubleClick?: (record: RecordType, index: number) => void;
    onContextMenu?: (record: RecordType, index: number) => void;
  };
}

/**
 * 行回调工具函数类型
 */
export interface RowCallbackHelpers<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 合并行回调属性 */
  mergeRowProps: (
    defaultProps: Partial<EnhancedRowCallbackProps<RecordType>>,
    customProps: Partial<EnhancedRowCallbackProps<RecordType>>,
  ) => EnhancedRowCallbackProps<RecordType>;

  /** 创建行事件处理器 */
  createRowHandler: <EventType extends React.SyntheticEvent>(
    handler: (event: EventType, record: RecordType, index: number) => void,
  ) => (event: EventType) => void;

  /** 绑定行数据到事件 */
  bindRowData: (
    record: RecordType,
    index: number,
    props: Partial<EnhancedRowCallbackProps<RecordType>>,
  ) => EnhancedRowCallbackProps<RecordType>;
}
