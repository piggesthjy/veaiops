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
 * Filters 组件统一导出
 */

// 重新导出主组件
export { Filters } from './filters';
export { default as FiltersDefault } from './filters';

// 重新导出核心类型
export type {
  FiltersComponentProps,
  FilterStyle,
  FieldItem,
} from './core/types';

// 重新导出插件系统的类型
export type {
  FilterPlugin,
  FilterPluginContext,
  FilterPluginRenderProps,
  PluginConfig,
  FilterEventBus,
} from '@veaiops/types';

// 导出工具函数和常量
export * from './core/constants';
export * from './core/utils';
export * from './core/renderer';

// 选择性导出插件系统，避免类型冲突
export {
  filterPluginRegistry,
  initializeCorePlugins,
  getPluginStats,
  pluginExtensionManager,
  corePlugins,
} from './plugins';

// 导出预设
export * from './presets';
