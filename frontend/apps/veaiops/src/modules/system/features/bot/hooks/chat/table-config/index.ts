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

import type { CustomTableActionType } from '@veaiops/components';
import { useBusinessTable } from '@veaiops/components';
import type { Chat } from 'api-generate';
import type React from 'react';
import { useChatTableRequest } from './request';
import { useChatTableProps } from './table-props';

/**
 * 群管理表格配置Hook的参数接口
 */
export interface UseChatTableConfigParams {
  ref?: React.Ref<CustomTableActionType<Chat>>;
}

/**
 * 群管理表格配置Hook
 *
 * 拆分说明：
 * - request.ts: API请求配置（request函数和dataSource）
 * - table-props.ts: 表格属性配置（tableProps和memoizedTableProps）
 * - index.ts: 统一导出，组合所有逻辑，使用 useBusinessTable 自动处理刷新
 *
 * ✅ 已使用工具函数：
 * - createTableRequestWithResponseHandler: 自动处理分页参数和响应
 * - createServerPaginationDataSource: 创建服务器端分页数据源
 * - createStandardTableProps: 创建标准表格属性配置
 * - useBusinessTable: 自动处理刷新逻辑
 */
export const useChatTableConfig = ({ ref }: UseChatTableConfigParams) => {
  // API请求配置
  const { dataSource } = useChatTableRequest();

  // 表格属性配置
  const { memoizedTableProps } = useChatTableProps();

  // 🎯 使用 useBusinessTable 自动处理刷新逻辑
  // ✅ 传递函数形式的 tableProps 给 useBusinessTable
  const { customTableProps, operations } = useBusinessTable({
    dataSource,
    tableProps: memoizedTableProps, // ✅ 传递函数而不是对象
    refreshConfig: {
      enableRefreshFeedback: false, // ChatTable 不使用刷新反馈
    },
    // ref 类型已支持泛型参数，无需类型断言
    ref,
  });

  return {
    customTableProps,
    operations,
  };
};
