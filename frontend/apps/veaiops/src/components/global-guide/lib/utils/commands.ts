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

import { GlobalGuideStepNumber } from '../../enums/guide-steps.enum';
import {
  createDebugStepClickCommand,
  debugUrlState,
  exportGlobalGuideLogs,
} from './debug';
import {
  analyzeGlobalGuide,
  exportAllGlobalGuideLogs,
  quickDiagnoseGlobalGuide,
} from './diagnostics';
import './types'; // 导入 Window 接口扩展

/**
 * 注册控制台调试命令
 *
 * 注册到全局 window 对象，供开发者在浏览器控制台使用
 *
 * @param handleStepClick - 步骤点击处理函数
 * @returns 清理函数
 */
export const registerConsoleCommands = (
  handleStepClick: (stepNumber: number) => void,
): (() => void) => {
  // 注册日志导出和诊断命令
  window.exportAllGlobalGuideLogs = exportAllGlobalGuideLogs;
  window.quickDiagnoseGuide = quickDiagnoseGlobalGuide;
  window.analyzeGlobalGuide = analyzeGlobalGuide;

  // 注册步骤调试命令
  window.debugStep1Click = createDebugStepClickCommand({
    handleStepClick,
    stepNumber: GlobalGuideStepNumber.CONNECTION,
    stepName: '第一步',
  });

  window.debugStep2Click = createDebugStepClickCommand({
    handleStepClick,
    stepNumber: GlobalGuideStepNumber.DATASOURCE,
    stepName: '第二步',
  });

  // 注册其他调试命令
  window.debugUrlState = debugUrlState;
  window.exportGlobalGuideLogs = exportGlobalGuideLogs;

  // 返回清理函数
  return () => {
    // 清理时移除全局方法
    delete window.exportAllGlobalGuideLogs;
    delete window.quickDiagnoseGuide;
    delete window.analyzeGlobalGuide;
    delete window.debugStep1Click;
    delete window.debugStep2Click;
    delete window.debugUrlState;
    delete window.exportGlobalGuideLogs;
  };
};
