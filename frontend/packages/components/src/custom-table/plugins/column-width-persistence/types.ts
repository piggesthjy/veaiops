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
 * 列宽持久化插件类型定义
 * 类型已迁移到 ../../types/plugins/column-width-persistence.ts
 * 此文件保留以兼容现有引用，实际类型请从types目录导入
 *

 *
 */

// 重新导出核心类型
export type {
  ColumnWidthPersistenceConfig,
  ColumnWidthPersistenceState,
  ResizeEvent,
  EnhancedRowCallbackProps,
  ColumnWidthHelpers,
  TablePropsWithColumnWidth,
} from '@/custom-table/types/plugins/column-width-persistence';

// 保留独有的接口
/**
 * 列宽信息
 */
export interface ColumnWidthInfo {
  /** 列标识 */
  dataIndex: string;
  /** 列宽度 */
  width: number;
  /** 检测时间戳 */
  timestamp: number;
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

  /** 清除特定列的持久化宽度 */
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
