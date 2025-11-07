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
 * 表格列相关类型定义
 */

import type { DataSource } from 'api-generate';

/**
 * 删除处理函数类型
 *
 * ✅ 符合异步方法错误处理规范：
 * - 支持返回 { success: boolean; error?: Error } 格式的结果对象
 * - 同时也支持 void/Promise<void> 格式（向后兼容）
 */
export type DeleteHandler = (
  id: string,
) => void | Promise<void> | Promise<{ success: boolean; error?: Error }>;

/**
 * 查看处理函数类型
 */
export type ViewHandler = (item: DataSource) => void;

/**
 * 编辑处理函数类型
 */
export type EditHandler = (item: DataSource) => void;

/**
 * 配置项类型
 */
export interface ConfigItem {
  configKey: string;
  value: unknown;
}
