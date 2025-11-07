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

import type { ModernTableColumnProps } from "@veaiops/components";
import type { IntelligentThresholdTask } from "api-generate";
import type { TaskTableActions } from "./types";
import {
  getBasicColumns,
  getResourceColumns,
  getConfigColumns,
  getMetadataColumns,
  getActionColumn,
} from "./column-definitions";

/**
 * 获取智能阈值任务表格列配置
 * @description 组合各个模块的列配置，提供完整的表格列定义
 * @param actions 表格操作回调函数集合
 * @returns 完整的表格列配置数组
 */
export const getTaskColumns = (
  actions: TaskTableActions
): ModernTableColumnProps<IntelligentThresholdTask>[] => {
  return [
    ...getBasicColumns(), // 基础信息：任务名称、数据源类型、状态
    ...getResourceColumns(), // 资源信息：产品、项目、账户
    ...getConfigColumns(), // 配置信息：自动更新、最新版本
    ...getMetadataColumns(), // 元数据：创建人、创建时间、更新时间
    getActionColumn(actions), // 操作列：编辑、重新执行、更多操作
  ];
};
