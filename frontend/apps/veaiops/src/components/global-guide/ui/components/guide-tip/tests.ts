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
 * 引导提示组件测试函数
 * 仅在开发环境中使用
 */

import { showGuideTip } from './guide-tip';

/**
 * 测试箭头指向功能
 * 在控制台中调用此函数来测试不同位置的箭头
 */
export const testArrowPointing = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // 测试不同位置的箭头
  const testCases = [
    {
      content: '这是顶部箭头测试',
      selector: '[data-testid="new-connection-btn"]',
      placement: 'top' as const,
    },
    {
      content: '这是底部箭头测试',
      selector: '[data-testid="new-connection-btn"]',
      placement: 'bottom' as const,
    },
    {
      content: '这是左侧箭头测试',
      selector: '[data-testid="new-connection-btn"]',
      placement: 'left' as const,
    },
    {
      content: '这是右侧箭头测试',
      selector: '[data-testid="new-connection-btn"]',
      placement: 'right' as const,
    },
  ];

  let currentIndex = 0;

  const showNextTest = () => {
    if (currentIndex < testCases.length) {
      const testCase = testCases[currentIndex];
      showGuideTip({
        ...testCase,
        buttonText:
          currentIndex === testCases.length - 1 ? '完成测试' : '下一个',
        onClose: () => {
          currentIndex++;
          if (currentIndex < testCases.length) {
            setTimeout(showNextTest, 500);
          }
        },
      });
    }
  };

  showNextTest();
};

/**
 * 测试箭头显示功能
 * 在控制台中调用此函数来测试箭头是否正常显示
 */
export const testArrowDisplay = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // 测试箭头显示
  showGuideTip({
    content: '这是一个测试箭头显示的提示',
    selector: '[data-testid="new-connection-btn"]',
    placement: 'top',
    showArrow: true,
    buttonText: '测试完成',
    autoClose: false,
    closeOnOutsideClick: true,
    onClose: () => {},
  });
};

/**
 * 测试删除按钮箭头指向
 * 在控制台中调用此函数来测试删除按钮的箭头是否指向正确
 */
export const testDeleteButtonArrow = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // 测试删除按钮箭头指向
  showGuideTip({
    content: '请先在列表中选择一条连接记录，然后点击此处的删除按钮🌟',
    selector: '[data-testid="delete-connection-btn"]',
    placement: 'top',
    showArrow: true,
    buttonText: '知道了',
    autoClose: false,
    closeOnOutsideClick: true,
    onClose: () => {},
  });
};

/**
 * 测试箭头和tip同步消失效果
 * 在控制台中调用此函数来测试箭头和tip是否同时消失
 */
export const testArrowTipSync = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // 测试箭头和tip同步消失
  showGuideTip({
    content: '测试箭头和tip同步消失效果 - 点击"知道了"按钮或点击外部区域',
    selector: '[data-testid="new-connection-btn"]',
    placement: 'top',
    showArrow: true,
    buttonText: '知道了',
    autoClose: false,
    closeOnOutsideClick: true,
    onClose: () => {},
  });
};

// 将测试函数挂载到全局对象（与原分支一致）
if (typeof window !== 'undefined') {
  (window as any).testArrowDisplay = testArrowDisplay;
  (window as any).testDeleteButtonArrow = testDeleteButtonArrow;
  (window as any).testArrowTipSync = testArrowTipSync;
}
