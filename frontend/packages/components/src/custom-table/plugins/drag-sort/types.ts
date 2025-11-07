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
 * 拖拽排序插件类型定义
 * 基于 EPS 平台的 react-sortable-hoc 能力
 */
import type { ReactNode } from 'react';
import type { SortEndHandler } from 'react-sortable-hoc';

/**
 * 拖拽类型
 */
export type DragType = 'row' | 'column' | 'both';

/**
 * 拖拽限制配置
 */
export interface DragConstraints {
  /** 可拖拽的行范围 */
  rowRange?: [number, number];
  /** 可拖拽的列范围 */
  columnRange?: [number, number];
  /** 禁止拖拽的行索引 */
  disabledRows?: number[];
  /** 禁止拖拽的列索引 */
  disabledColumns?: number[];
  /** 自定义拖拽判断函数 */
  canDrag?: (index: number, type: 'row' | 'column') => boolean;
}

/**
 * 拖拽样式配置
 */
export interface DragStyleConfig {
  /** 拖拽时的样式类名 */
  draggingClassName?: string;
  /** 拖拽手柄图标 */
  handleIcon?: ReactNode;
  /** 是否显示拖拽手柄 */
  showHandle?: boolean;
  /** 拖拽预览样式 */
  previewStyle?: React.CSSProperties;
}

/**
 * 拖拽排序配置
 */
export interface DragSortConfig {
  /** 是否启用插件 */
  enabled?: boolean;
  /** 插件优先级 */
  priority?: number;
  /** 拖拽类型 */
  dragType?: DragType;
  /** 拖拽限制 */
  constraints?: DragConstraints;
  /** 拖拽样式配置 */
  styleConfig?: DragStyleConfig;
  /** 行拖拽完成回调 */
  onRowSortEnd?: SortEndHandler;
  /** 列拖拽完成回调 */
  onColumnSortEnd?: SortEndHandler;
  /** 拖拽开始回调 */
  onSortStart?: (sort: {
    node: Element;
    index: number;
    collection: string;
  }) => void;
  /** 是否使用虚拟滚动 */
  useVirtualScroll?: boolean;
}

/**
 * 插件状态
 */
export interface DragSortState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 当前拖拽的索引 */
  draggingIndex: number;
  /** 拖拽类型 */
  draggingType: 'row' | 'column' | null;
  /** 行排序状态 */
  rowSortOrder: number[];
  /** 列排序状态 */
  columnSortOrder: number[];
}
