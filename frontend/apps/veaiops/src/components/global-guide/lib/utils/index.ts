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
 * GlobalGuide 工具函数统一导出
 *
 * 架构说明（符合 .cursorrules Feature-Based 架构）：
 * - types.ts - 类型定义（Window 接口扩展、StepIssue 等）
 * - issues.ts - 步骤问题检查
 * - progress.ts - 步骤进度获取
 * - diagnostics.ts - 诊断功能（localStorage 和 DOM 检查）
 * - debug.ts - 调试命令（步骤点击、URL 状态等）
 * - commands.ts - 控制台命令注册（入口函数）
 * - wait.ts - 元素等待工具（原 element-wait.ts）
 * - log-collector.ts - 日志收集器（原 global-guide-log-collector.ts）
 */

// 导出类型定义
export type { GlobalGuideStore, StepIssue } from './types';

// 导出步骤相关功能
export { getCurrentStepIssues } from './issues';
export { getCurrentProgressStep } from './progress';

// 导出诊断功能
export {
  analyzeGlobalGuide,
  exportAllGlobalGuideLogs,
  quickDiagnoseGlobalGuide,
} from './diagnostics';

// 导出调试命令
export {
  createDebugStepClickCommand,
  debugUrlState,
} from './debug';
export type { DebugStepClickParams } from './debug';

// 导出控制台命令注册（主入口函数）
export { registerConsoleCommands } from './commands';

// 导出元素等待工具
export * from './wait';

// 导出日志收集器
export * from './log-collector';
