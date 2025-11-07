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
 * GlobalGuide 工具类型定义
 */

/**
 * localStorage 存储的数据结构
 */
export interface GlobalGuideStore {
  state?: {
    guideVisible?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * 步骤问题类型
 */
export interface StepIssue {
  type: string;
  message: string;
  action: string;
}

/**
 * Window 接口扩展 - GlobalGuide 调试命令
 *
 * 为什么扩展 Window 接口：
 * - 需要在全局 window 对象上注册调试命令，供开发者在浏览器控制台使用
 * - TypeScript 需要明确的类型定义，避免使用 (window as any)
 * - 符合 .cursorrules 的类型安全规范
 */
declare global {
  interface Window {
    // GlobalGuide 日志导出
    exportAllGlobalGuideLogs?: (filename?: string) => void;
    // 快速诊断
    quickDiagnoseGuide?: () => void;
    // 综合分析
    analyzeGlobalGuide?: () => void;
    // 调试第一步点击
    debugStep1Click?: () => void;
    // 调试第二步点击
    debugStep2Click?: () => void;
    // 调试 URL 状态
    debugUrlState?: () => void;
    // 导出 GlobalGuide 日志
    exportGlobalGuideLogs?: () => void;
  }
}
