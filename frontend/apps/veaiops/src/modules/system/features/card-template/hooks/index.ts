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
 * 卡片模板 Hooks 统一导出
 *
 * 目录结构说明：
 * - table/         - 表格配置 Hook（简化：use-card-template-table-config → table/）
 * - crud/          - CRUD 操作 Hook（简化：use-card-template-crud → crud/）
 * - management/    - 管理逻辑 Hook（简化：use-management-logic → management/）
 * - card-template/ - 卡片模板工具（已存在，保留）
 * - use-card-template/ - 卡片模板 Hook（已存在，保留）
 */

// ==================== Table 表格配置 ====================
// ✅ 简化：use-card-template-table-config.tsx → table/
export * from './table';

// ==================== CRUD 操作 ====================
// ✅ 简化：use-card-template-crud.ts → crud/
export * from './crud';

// ==================== Management 管理逻辑 ====================
// ✅ 简化：use-management-logic.ts → management/
export * from './management';

// ==================== Card Template 工具 ====================
// ✅ 已存在：card-template/ 目录
// 注意：card-template 目录的内容已拆分到其他目录：
// - useCardTemplateManagementLogic → ./management
// - transformAgentTemplateToTableData → ./use-card-template/utils/transform
// 如果需要访问 card-template/lib 中的类型和工具，请直接导入该目录
// export * from './card-template'; // 已移除，避免重复导出

// ==================== Use Card Template Hook ====================
// ✅ 已存在：use-card-template/ 目录
// 注意：useCardTemplateManagementLogic 已从 ./management 导出，此处不再导出（避免重复）
// UseCardTemplateManagementLogicParams 类型已从 ./management 导出，此处从 management 统一导出
export type { UseCardTemplateManagementLogicParams } from './management';
