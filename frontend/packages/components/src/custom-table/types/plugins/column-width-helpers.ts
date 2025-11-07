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
 * 列宽辅助工具类型定义
 * 提供列宽计算、分配、持久化等工具函数类型
 */

import type { ColumnProps } from '@arco-design/web-react/es/Table/interface';
import type { BaseRecord } from '../core/common';
import type { ColumnResizeEvent, ResizeEvent } from './resize-event';

/**
 * 列宽信息
 */
export interface ColumnWidthInfo {
  /** 列标识 */
  dataIndex: string;
  /** 当前宽度 */
  width: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 是否可调整大小 */
  resizable?: boolean;
  /** 是否固定宽度 */
  fixed?: boolean;
  /** 宽度类型 */
  widthType?: 'auto' | 'fixed' | 'percentage' | 'flex';
  /** 百分比宽度（0-100） */
  percentage?: number;
  /** Flex 比例 */
  flex?: number;
}

/**
 * 列宽分配策略
 */
export type ColumnWidthStrategy =
  | 'auto'
  | 'equal'
  | 'content'
  | 'percentage'
  | 'flex'
  | 'custom';

/**
 * 列宽分配配置
 */
export interface ColumnWidthAllocation {
  /** 分配策略 */
  strategy: ColumnWidthStrategy;
  /** 最小总宽度 */
  minTotalWidth?: number;
  /** 最大总宽度 */
  maxTotalWidth?: number;
  /** 是否允许超出容器 */
  allowOverflow?: boolean;
  /** 自定义分配函数 */
  customAllocator?: (
    columns: ColumnWidthInfo[],
    containerWidth: number,
  ) => ColumnWidthInfo[];
}

/**
 * 列宽约束
 */
export interface ColumnWidthConstraints {
  /** 全局最小列宽 */
  globalMinWidth?: number;
  /** 全局最大列宽 */
  globalMaxWidth?: number;
  /** 特定列的约束 */
  columnConstraints?: Record<
    string,
    {
      minWidth?: number;
      maxWidth?: number;
      fixed?: boolean;
    }
  >;
  /** 总宽度约束 */
  totalWidthConstraints?: {
    min?: number;
    max?: number;
    preferred?: number;
  };
}

/**
 * 列宽持久化选项
 */
export interface ColumnWidthPersistenceOptions {
  /** 存储键前缀 */
  storageKey: string;
  /** 存储方式 */
  storageType?: 'localStorage' | 'sessionStorage' | 'custom';
  /** 自定义存储方法 */
  customStorage?: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
  };
  /** 版本控制 */
  version?: string;
  /** 过期时间 (ms) */
  expireTime?: number;
}

/**
 * 列宽状态
 */
export interface ColumnWidthState {
  /** 当前列宽映射 */
  widths: Record<string, number>;
  /** 列宽历史 */
  history: ColumnWidthInfo[][];
  /** 是否已初始化 */
  initialized: boolean;
  /** 上次更新时间 */
  lastUpdated: number;
  /** 容器宽度 */
  containerWidth: number;
  /** 总列宽 */
  totalWidth: number;
}

/**
 * 列宽计算结果
 */
export interface ColumnWidthCalculation {
  /** 分配后的列宽信息 */
  columns: ColumnWidthInfo[];
  /** 总宽度 */
  totalWidth: number;
  /** 是否发生变化 */
  hasChanges: boolean;
  /** 变化的列 */
  changedColumns: string[];
  /** 计算元数据 */
  metadata: {
    strategy: ColumnWidthStrategy;
    containerWidth: number;
    availableWidth: number;
    usedWidth: number;
    remainingWidth: number;
  };
}

/**
 * 列宽辅助工具函数类型
 */
export interface ColumnWidthHelpers {
  /** 计算列宽分配 */
  calculateColumnWidths: (
    columns: ColumnProps<BaseRecord>[],
    containerWidth: number,
    allocation: ColumnWidthAllocation,
    constraints?: ColumnWidthConstraints,
  ) => ColumnWidthCalculation;

  /** 应用列宽约束 */
  applyConstraints: (
    widthInfo: ColumnWidthInfo,
    constraints: ColumnWidthConstraints,
  ) => ColumnWidthInfo;

  /** 自动调整列宽 */
  autoFitColumns: (
    columns: ColumnProps<BaseRecord>[],
    containerWidth: number,
    strategy?: ColumnWidthStrategy,
  ) => ColumnWidthInfo[];

  /** 均匀分配列宽 */
  distributeEqualWidth: (
    columns: ColumnProps<BaseRecord>[],
    availableWidth: number,
  ) => ColumnWidthInfo[];

  /** 基于内容计算列宽 */
  calculateContentWidth: (
    column: ColumnProps<BaseRecord>,
    data: BaseRecord[],
    maxRows?: number,
  ) => number;

  /** 百分比转像素 */
  percentageToPixels: (percentage: number, containerWidth: number) => number;

  /** 像素转百分比 */
  pixelsToPercentage: (pixels: number, containerWidth: number) => number;

  /** 验证列宽配置 */
  validateColumnWidths: (
    widths: ColumnWidthInfo[],
    constraints?: ColumnWidthConstraints,
  ) => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };

  /** 合并列宽配置 */
  mergeColumnWidths: (
    defaultWidths: ColumnWidthInfo[],
    userWidths: Partial<ColumnWidthInfo>[],
  ) => ColumnWidthInfo[];

  /** 持久化列宽 */
  persistColumnWidths: (
    widths: ColumnWidthInfo[],
    options: ColumnWidthPersistenceOptions,
  ) => void;

  /** 恢复列宽 */
  restoreColumnWidths: (
    defaultWidths: ColumnWidthInfo[],
    options: ColumnWidthPersistenceOptions,
  ) => ColumnWidthInfo[];

  /** 清除持久化列宽 */
  clearPersistedWidths: (options: ColumnWidthPersistenceOptions) => void;

  /** 创建列宽调整处理器 */
  createResizeHandler: (
    onResize: (event: ColumnResizeEvent) => void,
    debounceMs?: number,
  ) => (dataIndex: string, newWidth: number) => void;

  /** 获取响应式列宽 */
  getResponsiveColumnWidths: (
    widths: ColumnWidthInfo[],
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl',
  ) => ColumnWidthInfo[];

  /** 优化列宽性能 */
  optimizeColumnWidths: (
    widths: ColumnWidthInfo[],
    performanceOptions?: {
      maxRenderColumns?: number;
      virtualScrolling?: boolean;
      lazyCalculation?: boolean;
    },
  ) => ColumnWidthInfo[];
}

/**
 * 扩展的表格属性（包含列宽功能）
 */
export interface TablePropsWithColumnWidth<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 列宽配置 */
  columnWidth?: {
    /** 列宽分配配置 */
    allocation?: ColumnWidthAllocation;
    /** 列宽约束 */
    constraints?: ColumnWidthConstraints;
    /** 持久化选项 */
    persistence?: ColumnWidthPersistenceOptions;
    /** 响应式断点配置 */
    responsive?: Record<string, Partial<ColumnWidthAllocation>>;
    /** 调整大小事件处理 */
    onResize?: (event: ResizeEvent) => void;
  };

  /** 是否启用列宽调整 */
  resizable?: boolean;

  /** 默认列宽 */
  defaultColumnWidth?: number;

  /** 最小列宽 */
  minColumnWidth?: number;

  /** 最大列宽 */
  maxColumnWidth?: number;
}
