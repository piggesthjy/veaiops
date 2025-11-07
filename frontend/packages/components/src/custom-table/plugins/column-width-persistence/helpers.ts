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

import type { PluginContext } from '@/custom-table/types';
import { devLog } from '@/custom-table/utils/log-utils';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import { PLUGIN_CONSTANTS } from './config';
import type { ColumnWidthPersistenceConfig } from './types';
import {
  detectAllColumnWidthsFromDOM,
  generateStorageKey,
  localStorageUtils,
  validateColumnWidth,
} from './utils';

/**
 * 类型守卫：确保 tableId 是 string 类型
 */
function assertTableId(tableId: string | undefined): asserts tableId is string {
  if (!tableId) {
    throw new Error('tableId is required');
  }
}

/**
 * 创建列宽持久化插件的辅助方法的参数接口
 */
export interface CreateColumnWidthHelpersParams {
  context: PluginContext;
  config: ColumnWidthPersistenceConfig;
  tableId: string | undefined;
  baseColumns: ColumnProps[];
}

/**
 * 设置持久化列宽的参数接口
 */
export interface SetPersistentColumnWidthParams {
  dataIndex: string;
  width: number;
}

/**
 * 创建列宽持久化插件的辅助方法
 */
export function createColumnWidthHelpers({
  context,
  config,
  tableId,
  baseColumns,
}: CreateColumnWidthHelpersParams) {
  return {
    // 设置单个列的持久化宽度
    setPersistentColumnWidth: ({
      dataIndex,
      width,
    }: SetPersistentColumnWidthParams) => {
      const validatedWidth = validateColumnWidth({
        width,
        config,
      });
      const persistenceState = (
        context.state as {
          columnWidthPersistence?: {
            tableId?: string;
            persistentWidths?: Record<string, number>;
          };
        }
      ).columnWidthPersistence;
      const resolvedTableId = persistenceState?.tableId || tableId;
      if (!resolvedTableId) {
        return;
      }
      // 类型收缩后，resolvedTableId 肯定不为空
      // 使用明确的类型声明确保 TypeScript 识别正确的类型
      const currentTableId: string = resolvedTableId;
      const currentPersistentWidths = persistenceState?.persistentWidths || {};

      // 更新持久化状态
      Object.assign(context.state, {
        columnWidthPersistence: {
          ...persistenceState,
          persistentWidths: {
            ...currentPersistentWidths,
            [dataIndex]: validatedWidth,
          },
        },
      });

      // 更新列配置
      const currentColumns =
        (context.state as { columns?: Record<string, unknown>[] }).columns ||
        [];
      const updatedColumns = currentColumns.map(
        (col: Record<string, unknown>) =>
          col.dataIndex === dataIndex ? { ...col, width: validatedWidth } : col,
      );
      Object.assign(context.state, { columns: updatedColumns });

      // 保存到本地存储
      if (
        config.enableLocalStorage &&
        localStorageUtils.isAvailable() &&
        resolvedTableId
      ) {
        // 使用类型守卫确保类型收缩
        assertTableId(resolvedTableId);
        // 类型守卫后，resolvedTableId 已经被收缩为 string 类型
        const storageKey = generateStorageKey({
          prefix: config.storageKeyPrefix,
          tableId: resolvedTableId,
        });
        const currentWidths = {
          ...currentPersistentWidths,
          [dataIndex]: validatedWidth,
        };
        localStorageUtils.save(storageKey, currentWidths);
      }

      devLog.log({
        component: PLUGIN_CONSTANTS.PLUGIN_NAME,
        message: `Set persistent width for ${dataIndex}: ${validatedWidth} (tableId: ${currentTableId})`,
      });
    },

    // 批量设置持久化列宽度
    setBatchPersistentColumnWidths: (widthsMap: Record<string, number>) => {
      const persistenceState = (
        context.state as {
          columnWidthPersistence?: {
            tableId?: string;
            persistentWidths?: Record<string, number>;
          };
        }
      ).columnWidthPersistence;
      const resolvedTableId = persistenceState?.tableId || tableId;
      if (!resolvedTableId) {
        return;
      }
      // 类型收缩后，resolvedTableId 肯定不为空
      // 使用明确的类型声明确保 TypeScript 识别正确的类型
      const currentTableId: string = resolvedTableId;
      const currentPersistentWidths = persistenceState?.persistentWidths || {};
      const validatedWidths: Record<string, number> = {};

      // 验证所有宽度值
      Object.entries(widthsMap).forEach(([dataIndex, width]) => {
        validatedWidths[dataIndex] = validateColumnWidth({
          width,
          config,
        });
      });

      // 更新持久化状态
      Object.assign(context.state, {
        columnWidthPersistence: {
          ...persistenceState,
          persistentWidths: {
            ...currentPersistentWidths,
            ...validatedWidths,
          },
        },
      });

      // 更新列配置
      const currentColumns =
        (context.state as { columns?: Record<string, unknown>[] }).columns ||
        [];
      const updatedColumns = currentColumns.map(
        (col: Record<string, unknown>) => {
          const { dataIndex } = col;
          const persistentWidth =
            typeof dataIndex === 'string'
              ? validatedWidths[dataIndex]
              : undefined;
          if (persistentWidth) {
            return { ...col, width: persistentWidth };
          }
          return col;
        },
      );
      Object.assign(context.state, { columns: updatedColumns });

      // 保存到本地存储
      if (
        config.enableLocalStorage &&
        localStorageUtils.isAvailable() &&
        resolvedTableId
      ) {
        // 使用类型守卫确保类型收缩
        assertTableId(resolvedTableId);
        // 类型守卫后，resolvedTableId 已经被收缩为 string 类型
        const storageKey = generateStorageKey({
          prefix: config.storageKeyPrefix,
          tableId: resolvedTableId,
        });
        const currentWidths = {
          ...(persistenceState?.persistentWidths || {}),
          ...validatedWidths,
        };
        localStorageUtils.save(storageKey, currentWidths);
      }

      devLog.log({
        component: PLUGIN_CONSTANTS.PLUGIN_NAME,
        message: `Batch set persistent widths: (tableId: ${currentTableId})`,
        data: validatedWidths,
      });
    },

    // 获取持久化列宽度
    getPersistentColumnWidth: (dataIndex: string): number | undefined => {
      const persistenceState = (
        context.state as {
          columnWidthPersistence?: {
            persistentWidths?: Record<string, number>;
          };
        }
      ).columnWidthPersistence;
      return persistenceState?.persistentWidths?.[dataIndex];
    },

    // 获取所有持久化列宽度
    getAllPersistentColumnWidths: (): Record<string, number> => {
      const persistenceState = (
        context.state as {
          columnWidthPersistence?: {
            persistentWidths?: Record<string, number>;
          };
        }
      ).columnWidthPersistence;
      return persistenceState?.persistentWidths || {};
    },

    // 清除持久化列宽度
    clearPersistentColumnWidths: () => {
      const persistenceState = (
        context.state as {
          columnWidthPersistence?: {
            tableId?: string;
            persistentWidths?: Record<string, number>;
          };
        }
      ).columnWidthPersistence;
      const resolvedTableId = persistenceState?.tableId || tableId;
      if (!resolvedTableId) {
        return;
      }
      // 类型收缩后，resolvedTableId 肯定不为空
      // 使用明确的类型声明确保 TypeScript 识别正确的类型
      const currentTableId: string = resolvedTableId;

      Object.assign(context.state, {
        columnWidthPersistence: {
          ...persistenceState,
          persistentWidths: {},
        },
      });

      // 清除本地存储
      if (config.enableLocalStorage && localStorageUtils.isAvailable()) {
        // resolvedTableId 在 if (!resolvedTableId) return 后保证非空
        if (!resolvedTableId) {
          return;
        }
        const storageKey = generateStorageKey({
          prefix: config.storageKeyPrefix,
          tableId: resolvedTableId,
        });
        localStorageUtils.remove(storageKey);
      }

      devLog.log({
        component: PLUGIN_CONSTANTS.PLUGIN_NAME,
        message: `Cleared persistent column widths (tableId: ${currentTableId})`,
      });
    },

    // 检测并保存当前列宽度
    detectAndSaveColumnWidths: (tableContainer: HTMLElement) => {
      if (!tableContainer) {
        return;
      }

      const dataIndexList = baseColumns
        .map((col: Record<string, unknown>) => col.dataIndex)
        .filter(
          (index): index is string =>
            typeof index === 'string' && Boolean(index),
        );
      const detectedWidths = detectAllColumnWidthsFromDOM({
        tableContainer,
        dataIndexList,
      });

      if (Object.keys(detectedWidths).length > 0) {
        const helpers = context.helpers as {
          setBatchPersistentColumnWidths?: (
            widthsMap: Record<string, number>,
          ) => void;
        };
        helpers.setBatchPersistentColumnWidths?.(detectedWidths);
      }
    },
  };
}
