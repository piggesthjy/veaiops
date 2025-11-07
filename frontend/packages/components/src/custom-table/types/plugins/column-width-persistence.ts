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
 * 列宽持久化插件类型定义 - 在types模块中
 *

 *
 */

import type { ColumnProps } from '@arco-design/web-react/es/Table';
import type { RowCallbackProps } from '@arco-design/web-react/es/Table/interface';
import type React from 'react';
import type { PluginBaseConfig } from './core';

/**
 * 列宽持久化插件配置
 */
export interface ColumnWidthPersistenceConfig extends PluginBaseConfig {
  /** 是否启用列宽持久化 */
  enabled?: boolean;

  /** 是否启用自动检测列宽变化 */
  enableAutoDetection?: boolean;

  /** 列宽检测的防抖时间(ms) */
  detectionDelay?: number;

  /** 存储键前缀 */
  storageKeyPrefix?: string;

  /** 是否启用本地存储持久化 */
  enableLocalStorage?: boolean;

  /** 最小列宽限制 */
  minColumnWidth?: number;

  /** 最大列宽限制 */
  maxColumnWidth?: number;
}

/**
 * 调整大小事件
 */
export interface ResizeEvent {
  size: { width: number; height: number };
}

/**
 * 增强的行回调属性
 */
export interface EnhancedRowCallbackProps extends RowCallbackProps {
  onResize?: (event: React.SyntheticEvent, data: ResizeEvent) => void;
}

/**
 * 列宽助手函数接口
 */
export interface ColumnWidthHelpers {
  setPersistentColumnWidth: (dataIndex: string, width: number) => void;
  setBatchPersistentColumnWidths: (widths: Record<string, number>) => void;
  getAllPersistentColumnWidths: () => Record<string, number>;
  detectAndSaveColumnWidths: (tableRef: HTMLElement) => void;
}

/**
 * 列宽持久化状态
 */
export interface ColumnWidthPersistenceState {
  /** 持久化的列宽映射 */
  persistentWidths: Record<string, number>;
  /** 表格ID */
  tableId?: string;
  /** 是否正在检测列宽 */
  isDetecting?: boolean;
  /** 最后检测时间 */
  lastDetectionTime?: number;
  /** 列宽历史记录 */
  widthHistory?: Array<{ timestamp: number; widths: Record<string, number> }>;
}

/**
 * 带列宽的表格属性
 */
export interface TablePropsWithColumnWidth {
  onHeaderCell?: (column: ColumnProps, index?: number) => RowCallbackProps;
  scroll?: { x?: string | number; y?: string | number };
  [key: string]: unknown;
}

/**
 * 列宽持久化插件方法
 */
export interface ColumnWidthPersistenceMethods {
  /** 设置单个列的持久化宽度 */
  setPersistentColumnWidth: (params: {
    dataIndex: string;
    width: number;
  }) => void;

  /** 批量设置持久化列宽度 */
  setBatchPersistentColumnWidths: (widthsMap: Record<string, number>) => void;

  /** 获取持久化列宽度 */
  getPersistentColumnWidth: (dataIndex: string) => number | undefined;

  /** 获取所有持久化列宽度 */
  getAllPersistentColumnWidths: () => Record<string, number>;

  /** 清除单个列的持久化宽度 */
  clearPersistentColumnWidth: (dataIndex: string) => void;

  /** 清除所有持久化列宽度 */
  clearAllPersistentColumnWidths: () => void;

  /** 从DOM检测当前列宽度 */
  detectCurrentColumnWidths: () => Promise<Record<string, number>>;

  /** 保存当前列宽度到持久化存储 */
  saveCurrentColumnWidths: () => Promise<void>;

  /** 从持久化存储恢复列宽度 */
  restoreColumnWidths: () => Promise<void>;

  /** 应用列宽度到表格 */
  applyColumnWidths: (widthsMap: Record<string, number>) => void;
}
