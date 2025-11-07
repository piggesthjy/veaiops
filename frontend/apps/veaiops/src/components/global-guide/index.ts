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

// 自动初始化日志收集（副作用导入）
import './lib/auto-log-init';

/**
 * GlobalGuide 模块统一导出
 *
 * 架构说明（符合 .cursorrules Feature-Based 架构）：
 * - lib/ - 配置、状态、工具（统一从 lib/index.ts 导出）
 * - ui/ - UI 组件（统一从 ui/index.ts 导出）
 * - hooks/ - 业务逻辑 Hooks（统一从 hooks/index.ts 导出）
 * - enums/ - 枚举定义
 *
 * 层层导出原则：
 * - 统一从各模块的 index.ts 导出
 * - 根 index.ts 统一重新导出所有模块
 */

// 导出 lib（配置、状态、工具）- 统一从 lib 导出（层层导出）
export * from './lib';

// 导出 UI 组件（统一从 ui 导出，包含主组件和子组件）
export * from './ui';

// 导出 hooks（统一从 hooks 导出）
export * from './hooks';

// 导出 enums（统一从 enums 导出）
export * from './enums';
