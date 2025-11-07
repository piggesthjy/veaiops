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
 * 卡片模板管理逻辑Hook
 * 提供卡片模板管理页面的所有业务逻辑
 *
 * ✅ 已拆分：
 * - useCardTemplateCRUD: CRUD 操作（../crud/）
 * - useCardTemplateTableConfig: 表格配置（../table/）
 * - useCardTemplateManagementLogic: 管理逻辑（../management/）
 *
 * 注意：
 * - useCardTemplateManagementLogic 已从 ../management 导出，此处不再导出（避免重复）
 * - UseCardTemplateManagementLogicParams 类型已从 ../management 导出，此处从 management 重新导出
 * - transformAgentTemplateToTableData 已从 ../card-template 导出，此处不再导出（避免重复）
 */
export type { UseCardTemplateManagementLogicParams } from '../management';

// ✅ 注意：useCardTemplateTableConfig 已独立拆分，从主文件导出
// 表格配置使用 useCardTemplateTableConfig（已独立文件）
