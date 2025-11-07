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
 * GlobalGuide lib 统一导出
 *
 * 架构说明（符合 .cursorrules Feature-Based 架构）：
 * - config.ts - 引导配置
 * - store.ts - 状态管理
 * - tracker.ts - 跟踪器
 * - types.ts - 类型定义
 * - debug-collector.ts - 调试日志收集器
 * - utils/ - 工具函数
 */

// 导出配置
export * from './config';

// 导出状态管理
export * from './store';

// 导出跟踪器
export * from './tracker';

// 导出类型
export * from './types';

// 导出调试日志收集器
export * from './debug-collector';

// 导出自动日志初始化
export { initializeAutoLogCollection } from './auto-log-init';

// 导出工具函数
export * from './utils';
