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
 * Table Columns Plugin Hooks
 *
 * 注意：原本的 useColumns Hook 已迁移到基础版本
 * 位置：@/custom-table/hooks/use-column-config.ts
 * 原因：统一列配置管理，避免功能重复
 *
 * 如果需要列宽持久化功能，可以在基础版本中添加，或使用 column-width-persistence 插件
 */
export { useColumns as useColumnConfig } from '@/custom-table/hooks/use-column-config';
