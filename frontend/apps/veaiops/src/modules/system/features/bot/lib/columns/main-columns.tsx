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

import type { ColumnProps } from "@arco-design/web-react/es/Table";
import type { Bot } from "../types";
import { getTableColumns } from './table-columns';

/**
 * Bot 表格列配置函数的参数接口
 *
 * 对应 CustomTable 的 handleColumns 函数参数结构
 * 包含查询参数和操作回调函数
 */
export interface BotColumnsProps {
  /** 编辑 Bot 的回调函数 */
  onEdit?: (bot: Bot) => void;
  /** 删除 Bot 的回调函数 */
  onDelete?: (botId: string) => void;
  /** 查看 Bot 属性的回调函数 */
  onViewAttributes?: (bot: Bot) => void;
  /** Bot 分组管理的回调函数（可选） */
  onGroupManagement?: (bot: Bot) => void;
  /** 查询参数（来自 CustomTable） */
  query?: Record<string, unknown>;
}

/**
 * 获取Bot表格列配置 - CustomTable方式
 * @param props - CustomTable传递的props对象，包含操作回调
 * @returns 表格列配置数组
 */
export const getBotColumns = (
  props: BotColumnsProps,
): ColumnProps<Bot>[] => {
  // 从props中提取onEdit、onDelete、onViewAttributes和onGroupManagement回调函数
  const {
    onEdit,
    onDelete,
    onViewAttributes,
    onGroupManagement,
  } = props;

  return getTableColumns({
    onEdit,
    onDelete,
    onViewAttributes,
    onGroupManagement,
  });
};
