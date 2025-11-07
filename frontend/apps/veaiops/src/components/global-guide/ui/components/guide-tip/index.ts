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
 * 引导提示组件主入口
 * 采用模块化设计，将功能拆分为多个文件
 */

// 导出类型定义
export type { GuideTipOptions, Position, Size } from './types';

// 导出工具函数
export {
  getElementRect,
  calculateTipPosition,
  createTipContainer,
  recalculateArrowPosition,
  cleanupExistingTips,
  validateTargetElement,
} from './utils';

// 导出主要功能
export { showGuideTip } from './guide-tip';

// 导出测试函数（开发环境）
export {
  testArrowPointing,
  testArrowDisplay,
  testDeleteButtonArrow,
  testArrowTipSync,
} from './tests';
