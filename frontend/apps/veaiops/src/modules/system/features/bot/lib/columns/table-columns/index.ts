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

import type { ColumnProps } from '@arco-design/web-react/es/Table';
import type { Bot } from '@bot/types';
import { getActionColumn } from './action-column';
import { getBaseColumns } from './base-columns';
import { getGroupManagementColumn } from './group-management-column';

interface TableColumnsProps {
  onEdit: (bot: Bot) => void;
  onDelete: (botId: string) => void | Promise<boolean>;
  onViewAttributes: (bot: Bot) => void;
  onGroupManagement?: (bot: Bot) => void;
}

/**
 * 获取表格列定义 - 传统方式
 *
 * 拆分说明：
 * - base-columns.tsx: 基础列定义（App ID、名称、Open ID）
 * - group-management-column.tsx: 群管理列定义
 * - action-column.tsx: 操作列定义（编辑、删除、特别关注）
 * - index.ts: 主入口，负责组装和导出
 */
export const getTableColumns = ({
  onEdit,
  onDelete,
  onViewAttributes,
  onGroupManagement,
}: TableColumnsProps): ColumnProps<Bot>[] => {
  const columns: ColumnProps<Bot>[] = [];

  // 基础列
  columns.push(...getBaseColumns());

  // 群管理列（如果提供回调）
  if (onGroupManagement) {
    columns.push(getGroupManagementColumn({ onGroupManagement }));
  }

  // 操作列
  columns.push(getActionColumn({ onEdit, onDelete, onViewAttributes }));

  return columns;
};
