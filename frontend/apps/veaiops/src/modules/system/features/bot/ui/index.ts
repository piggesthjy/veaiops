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
 * Bot UI 组件统一导出
 * 按照 Feature-Based 架构组织
 *
 * 架构说明：
 * - management.tsx: Bot管理主页面
 * - table.tsx: Bot表格组件
 * - attributes-table.tsx: Bot属性表格组件
 * - components/: 子组件目录
 *   - bot/: Bot 相关子组件
 *   - chat/: 群管理相关子组件
 *   - attributes/: 属性相关子组件
 */

// 主页面组件
export { BotManagement, default } from './management';
export { BotTable, default as BotTableDefault } from './table';
export { BotAttributesTable } from './attributes-table';

// 子组件（通过 components/index.ts 统一导出）
export * from './components';
