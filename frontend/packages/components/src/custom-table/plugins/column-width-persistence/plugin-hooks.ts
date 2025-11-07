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
import type React from 'react';
import { PLUGIN_CONSTANTS } from './config';
import { detectAllColumnWidthsFromDOM } from './utils';

/**
 * 创建插件 hooks 方法
 */
export function createPluginHooks(
  config: { enableAutoDetection?: boolean },
  tableId: string | undefined,
) {
  return {
    // 获取持久化列宽度
    getPersistentColumnWidths(...args: unknown[]) {
      const context = args[0] as PluginContext;
      const persistenceState = (
        context.state as {
          columnWidthPersistence?: {
            persistentWidths?: Record<string, number>;
          };
        }
      ).columnWidthPersistence;
      return persistenceState?.persistentWidths || {};
    },

    // 应用持久化列宽度到列配置
    applyPersistentWidthsToColumns(...args: unknown[]) {
      const context = args[0] as PluginContext;
      const columns = (args[1] as Record<string, unknown>[]) || [];
      const persistenceState = (
        context.state as {
          columnWidthPersistence?: {
            persistentWidths?: Record<string, number>;
          };
        }
      ).columnWidthPersistence;
      const persistentWidths = persistenceState?.persistentWidths || {};

      return columns.map((col) => {
        const persistentWidth = persistentWidths[col.dataIndex as string];
        if (persistentWidth) {
          return { ...col, width: persistentWidth };
        }
        return col;
      });
    },

    // 应用持久化配置到表格属性 - 默认配置方法
    applyPersistentWidths: (...args: unknown[]) => {
      const context = args[0] as PluginContext;
      const originalProps = (args[1] as Record<string, unknown>) || {};

      return {
        // 默认启用列宽调整
        resizable: true,
        // 默认启用水平滚动
        scroll: {
          x: 'max-content',
          ...((originalProps.scroll as Record<string, unknown>) || {}),
        },
        // 保留原始属性
        ...originalProps,

        // 增强列宽调整回调
        onHeaderCell: (column: Record<string, unknown>) => {
          const originalOnHeaderCell =
            (typeof originalProps.onHeaderCell === 'function'
              ? originalProps.onHeaderCell(column)
              : {}) || {};

          return {
            ...originalOnHeaderCell,
            onResize: (
              event: React.SyntheticEvent,
              { size }: { size?: { width?: number } },
            ) => {
              // 处理列宽调整
              if (size?.width && column.dataIndex) {
                const helpers = context.helpers as {
                  setPersistentColumnWidth?: (params: {
                    dataIndex: string;
                    width: number;
                  }) => void;
                };
                if (
                  helpers &&
                  typeof helpers.setPersistentColumnWidth === 'function'
                ) {
                  helpers.setPersistentColumnWidth({
                    dataIndex: column.dataIndex as string,
                    width: size.width,
                  });
                }
              }

              // 调用原始回调
              if (
                originalOnHeaderCell &&
                typeof originalOnHeaderCell.onResize === 'function'
              ) {
                originalOnHeaderCell.onResize(event, { size });
              }
            },
          };
        },

        // 增强表格引用回调，用于DOM检测
        ref: (tableRef: HTMLElement) => {
          if (tableRef && config.enableAutoDetection) {
            // 延迟检测，确保DOM已完全渲染并且helpers方法已就绪
            setTimeout(() => {
              const helpers = context.helpers as unknown as {
                detectAndSaveColumnWidths?: (ref: HTMLElement) => void;
                setBatchPersistentColumnWidths?: (
                  widths: Record<string, number>,
                ) => void;
              };
              if (
                helpers &&
                typeof helpers.detectAndSaveColumnWidths === 'function'
              ) {
                helpers.detectAndSaveColumnWidths(tableRef);
              } else {
                // 兜底：直接在此处进行一次列宽检测并保存，避免helpers未注入时丢失
                try {
                  const stateWithBaseColumns = context.state as unknown as {
                    baseColumns?: Array<{ dataIndex?: string }>;
                  };
                  const columnsForDetect =
                    stateWithBaseColumns.baseColumns || [];
                  const dataIndexList = Array.isArray(columnsForDetect)
                    ? columnsForDetect
                        .map(
                          (col) =>
                            col && (col as { dataIndex?: string }).dataIndex,
                        )
                        .filter(Boolean)
                    : [];
                  if (
                    dataIndexList.length > 0 &&
                    typeof detectAllColumnWidthsFromDOM === 'function'
                  ) {
                    const detectedWidths = detectAllColumnWidthsFromDOM({
                      tableContainer: tableRef,
                      dataIndexList: dataIndexList as string[],
                    });
                    if (
                      helpers &&
                      typeof helpers.setBatchPersistentColumnWidths ===
                        'function' &&
                      detectedWidths &&
                      Object.keys(detectedWidths).length > 0
                    ) {
                      helpers.setBatchPersistentColumnWidths(detectedWidths);
                      devLog.log({
                        component: PLUGIN_CONSTANTS.PLUGIN_NAME,
                        message:
                          'Fallback applied: detected widths saved via setBatchPersistentColumnWidths',
                        data: detectedWidths,
                      });
                      // 同时在此时补充 helpers.detectAndSaveColumnWidths，避免后续再次缺失
                      (
                        helpers as unknown as {
                          detectAndSaveColumnWidths?: (
                            container: HTMLElement,
                          ) => void;
                        }
                      ).detectAndSaveColumnWidths = (
                        container: HTMLElement,
                      ) => {
                        const againDetected = detectAllColumnWidthsFromDOM({
                          tableContainer: container,
                          dataIndexList: dataIndexList as string[],
                        });
                        if (
                          againDetected &&
                          Object.keys(againDetected).length > 0
                        ) {
                          helpers.setBatchPersistentColumnWidths?.(
                            againDetected,
                          );
                        }
                      };
                    }
                  }
                } catch (_fallbackError) {
                  // 静默处理错误
                }
              }
            }, 100);
          }

          // 调用原始ref
          if (typeof originalProps.ref === 'function') {
            originalProps.ref(tableRef);
          } else if (
            originalProps.ref &&
            typeof originalProps.ref === 'object' &&
            'current' in originalProps.ref
          ) {
            (originalProps.ref as { current: unknown }).current = tableRef;
          }
        },
      };
    },

    // 创建增强的Table组件props，集成列宽检测（兼容旧方法名）
    enhanceTableProps(...args: unknown[]) {
      const _context = args[0] as PluginContext;
      const originalProps = (args[1] as Record<string, unknown>) || {};

      return {
        // 默认启用列宽调整
        resizable: true,
        // 默认启用水平滚动
        scroll: {
          x: 'max-content',
          ...((originalProps.scroll as Record<string, unknown>) || {}),
        },
        // 保留原始属性
        ...originalProps,
      };
    },
  };
}
