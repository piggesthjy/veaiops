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

import type { BotAttributeFiltersQuery } from '@bot/lib';
import type { CustomTableActionType } from '@veaiops/components';
import { logger } from '@veaiops/utils';
import type { BotAttribute } from 'api-generate';
import type React from 'react';
import { useCallback } from 'react';

/**
 * 刷新属性表格的辅助函数Hook
 */
export const useRefreshAttributesTable = () => {
  // 刷新表格的辅助函数
  // 注意：接收 tableRef 作为参数，而不是从内部创建，避免与 config Hook 中的 tableRef 冲突
  const refreshTable = useCallback(
    async (
      tableRef: React.RefObject<
        CustomTableActionType<BotAttribute, BotAttributeFiltersQuery>
      > | null,
    ) => {
      if (tableRef?.current?.refresh) {
        // ✅ 正确：处理刷新方法的返回值
        const result = await tableRef.current.refresh();
        if (!result.success && result.error) {
          // 刷新失败，但不影响主操作，仅记录警告
          logger.warn({
            message: '属性表格刷新失败',
            data: {
              error: result.error.message,
              stack: result.error.stack,
              errorObj: result.error,
            },
            source: 'BotAttributes',
            component: 'refreshTable',
          });
        }
      }
    },
    [],
  );

  return {
    refreshTable,
  };
};
