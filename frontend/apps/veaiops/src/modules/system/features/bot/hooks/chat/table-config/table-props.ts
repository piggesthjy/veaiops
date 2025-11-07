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

import { createStandardTableProps } from '@veaiops/utils';
import { useCallback, useMemo } from 'react';

/**
 * 表格属性配置Hook
 *
 * ✅ 已使用工具函数：
 * - createStandardTableProps: 创建标准表格属性配置
 */
export const useChatTableProps = () => {
  // ✅ 使用工具函数创建表格属性配置
  const tableProps = useMemo(
    () =>
      createStandardTableProps({
        rowKey: 'chat_id',
        pageSize: 10,
        scrollX: 1000,
        // 注意：stripe 属性不在 createStandardTableProps 支持范围内
        // 如需 stripe，应在 CustomTable 的 tableProps 中直接配置
      }),
    [],
  );

  // ✅ 使用 useCallback 稳定化 tableProps 函数，避免每次渲染创建新引用
  // 注意：CustomTable 会传递 { loading: boolean } 参数，函数需要接收该参数
  const memoizedTableProps = useCallback(
    (ctx?: { loading?: boolean }) => ({
      ...tableProps,
      pagination: {
        pageSize: 10,
        sizeCanChange: true,
        showJumper: true,
        showTotal: true, // 使用默认的分页显示格式
      },
      // 可以根据 loading 状态调整其他属性（如需要）
      ...(ctx?.loading !== undefined && {}),
    }),
    [tableProps],
  );

  return {
    tableProps,
    memoizedTableProps,
  };
};
