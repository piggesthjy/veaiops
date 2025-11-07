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
 * 策略管理 UI 组件统一导出
 *
 * 目录结构说明：
 * - modal/    - 策略弹窗组件（已拆分，262 lines → 多文件）
 * - table/    - 策略表格组件（已重组，文件名简化）
 * - form.tsx  - 策略表单组件（168 lines）
 * - detail-drawer.tsx - 详情抽屉组件（107 lines）
 * - main.tsx  - 主页面组件（83 lines）
 */

// ✅ 重组：modal 目录（拆分后的组件）
export {
  default as StrategyModal,
  CardTemplateConfigMessage,
  type StrategyModalProps,
} from './modal';

// ✅ 重组：table 目录（文件名简化）
export { StrategyTable, type StrategyTableRef } from './table';

// ✅ 简化文件名：strategy-detail-drawer.tsx → detail-drawer.tsx
export { StrategyDetailDrawer } from './detail-drawer';

// ✅ 主组件（避免与 index.ts 循环依赖）
export { default as StrategyManagement } from './main';
