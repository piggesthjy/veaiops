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
 * 策略表格组件统一导出
 */

// ✅ 简化文件名：table.tsx (182 lines)
export { StrategyTable, type StrategyTableRef } from './table';

// ✅ 简化文件名：strategy-table-columns.tsx → columns.tsx (210 lines)
// 注意：如果该文件超过 150 行，后续可能需要进一步拆分
export * from './columns';

// ✅ 简化文件名：strategy-table-filters.tsx → filters.tsx
export * from './filters';
