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
 * SelectBlock Hooks 模块导出
 *
 * 主要导出：
 * - useSelectBlock: 主Hook，整合所有功能
 *
 * 子Hook导出（可用于独立使用或测试）：
 * - useBaseConfig: 基础配置处理
 * - useDebugLogging: 调试日志系统
 * - usePluginManager: 插件管理器
 * - useStateSubscription: 状态订阅
 * - useOptionsProcessing: 选项处理
 * - useEventHandlers: 事件处理器
 * - useFetchEffects: 数据获取副作用
 * - useDebugEffects: 调试副作用
 * - useDefaultValueEffects: 默认值副作用
 * - useReturnValue: 返回值构造
 */

// 主Hook导出
export { useSelectBlock } from './use-select-block';

// 子Hook导出（供高级用法和测试使用）
export { useBaseConfig } from './use-base-config';
export { useDebugLogging } from './use-debug-logging';
export { usePluginManager } from './use-plugin-manager';
export { useStateSubscription } from './use-state-subscription';
export { useOptionsProcessing } from './use-options-processing';
export { useEventHandlers } from './use-event-handlers';
export { useFetchEffects } from './use-fetch-effects';
export { useDebugEffects } from './use-debug-effects';
export { useDefaultValueEffects } from './use-default-value-effects';
export { useReturnValue } from './use-return-value';

// 类型导出
export type { veArchSelectBlockProps, SelectOption } from '../types/interface';

export type { SelectBlockState } from '../types/plugin';
