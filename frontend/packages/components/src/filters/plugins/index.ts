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
 * 过滤器插件系统统一导出
 * @description 过滤器插件系统的入口文件，提供所有插件相关功能的导出

 *
 */

// ===== 类型定义导出 =====
export type {
  FieldItem,
  FilterEventBus,
  FilterPlugin,
  FilterPluginContext,
  FilterPluginHooks,
  FilterPluginRenderProps,
  PluginConfig,
  PluginRegistryOptions,
} from '@veaiops/types';

// ===== 核心组件导出 =====
export * from './extension/manager';
export * from './registry';

// ===== 核心插件导出 =====
export * from './core/date.plugin';
export * from './core/input.plugin';
export * from './core/select.plugin';

// ===== 插件集合和初始化 =====
export * from './core-plugins';
export * from './initialization';
