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
 * Renderers - 统一导出入口
 * 职责：提供完整的渲染器功能，包括核心组件、业务逻辑和特定提供商的渲染器
 *
 * 目录结构：
 * - core/: 核心渲染组件和函数
 * - components/: UI组件
 * - providers/: 特定云服务商的渲染器
 */

// 导出主要业务函数
export { renderDataSourceConfig } from './render-data-source-config';

// 导出组件
export { CollapsibleConfigItems } from './components';

// 导出核心渲染器（供高级使用）
export {
  renderAllConfigItems,
  ConfigKeyLabel,
  ConfigValueRenderer,
  ConfigValueContent,
  ConfigItemRenderer,
} from './core';

// 导出类型
export type { ConfigItem } from './core';

// 导出特定云服务商的渲染器
export * from './providers';
