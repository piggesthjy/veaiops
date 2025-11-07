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

/**
 * 创建表格事件处理器
 */
export function createTableEvents() {
  return {
    // 分页变化时应用持久化列宽
    onPageChange: (context: PluginContext, ..._args: unknown[]) => {
      setTimeout(() => {
        const persistentWidths =
          (
            context.helpers as unknown as {
              getAllPersistentColumnWidths?: () => Record<string, number>;
            }
          ).getAllPersistentColumnWidths?.() || {};
        if (Object.keys(persistentWidths).length > 0) {
          (
            context.helpers as {
              setBatchPersistentColumnWidths?: (
                widthsMap: Record<string, number>,
              ) => void;
            }
          ).setBatchPersistentColumnWidths?.(persistentWidths);
        }
      }, 50); // 延迟应用，确保新页面数据已渲染
    },

    // 数据变化时保持列宽
    onDataChange: (context: PluginContext, ..._args: unknown[]) => {
      setTimeout(() => {
        const persistentWidths =
          (
            context.helpers as unknown as {
              getAllPersistentColumnWidths?: () => Record<string, number>;
            }
          ).getAllPersistentColumnWidths?.() || {};
        if (Object.keys(persistentWidths).length > 0) {
          (
            context.helpers as {
              setBatchPersistentColumnWidths?: (
                widthsMap: Record<string, number>,
              ) => void;
            }
          ).setBatchPersistentColumnWidths?.(persistentWidths);
        }
      }, 50);
    },
  };
}
