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
 * 引导提示组件工具函数
 */

import { logger } from '@veaiops/utils';
import type { GuideTipOptions, Position, Size } from './types';

/**
 * 计算元素位置和尺寸
 */
export const getElementRect = (element: Element): Position & Size => {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
    width: rect.width,
    height: rect.height,
  };
};

/**
 * 创建提示框容器和元素（按原分支实现）
 */
export const createTipContainer = (
  options: GuideTipOptions,
): {
  tipContainer: HTMLElement;
  tipElement: HTMLElement;
  contentElement: HTMLElement;
  closeButton: HTMLButtonElement | null;
  arrowElement: HTMLDivElement | null;
} => {
  // 创建提示框容器（全屏覆盖层）
  const tipContainer = document.createElement('div');
  tipContainer.setAttribute('data-guide-tip', 'true');
  tipContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    pointer-events: none;
  `;

  // 创建提示框
  const tipElement = document.createElement('div');
  const baseStyle = `
    position: absolute;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 0;
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.25);
    max-width: 360px;
    min-width: 300px;
    pointer-events: auto;
    backdrop-filter: blur(20px);
  `;

  tipElement.style.cssText = baseStyle;

  // 应用自定义样式
  Object.assign(tipElement.style, options.customStyle || {});

  // 创建内容区域
  const contentElement = document.createElement('div');
  contentElement.style.cssText = `
    background: rgba(255, 255, 255, 0.98);
    margin: 3px;
    border-radius: 13px;
    padding: 20px 24px;
    font-size: 15px;
    line-height: 1.7;
    color: #2c3e50;
    font-weight: 500;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  `;
  contentElement.textContent = options.content;

  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  `;

  // 创建关闭按钮
  let closeButton: HTMLButtonElement | null = null;
  if (options.buttonText) {
    closeButton = document.createElement('button');
    closeButton.textContent = options.buttonText;
    closeButton.style.cssText = `
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      position: relative;
      overflow: hidden;
    `;

    // 添加按钮悬停效果
    closeButton.addEventListener('mouseenter', () => {
      closeButton!.style.transform = 'translateY(-2px)';
      closeButton!.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton!.style.transform = 'translateY(0)';
      closeButton!.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
    });

    // 添加按钮点击效果
    closeButton.addEventListener('mousedown', () => {
      closeButton!.style.transform = 'translateY(0) scale(0.98)';
    });

    closeButton.addEventListener('mouseup', () => {
      closeButton!.style.transform = 'translateY(-2px) scale(1)';
    });

    // 组装按钮容器
    buttonContainer.appendChild(closeButton);
    contentElement.appendChild(buttonContainer);
  }

  // 组装提示框
  tipElement.appendChild(contentElement);
  tipContainer.appendChild(tipElement);

  // 创建箭头（如果需要）- 放在tipContainer中，避免被裁剪
  let arrowElement: HTMLDivElement | null = null;
  if (options.showArrow !== false) {
    arrowElement = document.createElement('div');

    // 根据placement设置不同的箭头样式
    let arrowStyle = '';
    switch (options.placement || 'top') {
      case 'top':
        arrowStyle = `
          position: absolute;
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-top: 16px solid #667eea;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15));
          z-index: 10000;
          pointer-events: none;
          opacity: 1;
          visibility: visible;
        `;
        break;
      case 'bottom':
        arrowStyle = `
          position: absolute;
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-bottom: 16px solid #667eea;
          filter: drop-shadow(0 -3px 6px rgba(0, 0, 0, 0.15));
          z-index: 10000;
          pointer-events: none;
          opacity: 1;
          visibility: visible;
        `;
        break;
      case 'left':
        arrowStyle = `
          position: absolute;
          width: 0;
          height: 0;
          border-top: 12px solid transparent;
          border-bottom: 12px solid transparent;
          border-left: 16px solid #667eea;
          filter: drop-shadow(3px 0 6px rgba(0, 0, 0, 0.15));
          z-index: 10000;
          pointer-events: none;
          opacity: 1;
          visibility: visible;
        `;
        break;
      case 'right':
        arrowStyle = `
          position: absolute;
          width: 0;
          height: 0;
          border-top: 12px solid transparent;
          border-bottom: 12px solid transparent;
          border-right: 16px solid #667eea;
          filter: drop-shadow(-3px 0 6px rgba(0, 0, 0, 0.15));
          z-index: 10000;
          pointer-events: none;
          opacity: 1;
          visibility: visible;
        `;
        break;
      default:
        // 默认使用top样式
        arrowStyle = `
          position: absolute;
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-top: 16px solid #667eea;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15));
          z-index: 10000;
          pointer-events: none;
          opacity: 1;
          visibility: visible;
        `;
        break;
    }

    arrowElement.style.cssText = arrowStyle;
    tipContainer.appendChild(arrowElement);
  }

  return {
    tipContainer,
    tipElement,
    contentElement,
    closeButton,
    arrowElement,
  };
};

/**
 * 计算提示框位置（按原分支实现）
 */
export const calculateTipPosition = (
  targetRect: Position & Size,
  tipElement: HTMLElement,
  placement: GuideTipOptions['placement'] = 'top',
): { left: number; top: number; arrowLeft: number; arrowTop: number } => {
  const tipRect = tipElement.getBoundingClientRect();
  const rect = targetRect;

  let left = 0;
  let top = 0;
  let arrowLeft = 0;
  let arrowTop = 0;

  switch (placement) {
    case 'top':
      left = rect.left + rect.width / 2 - tipRect.width / 2;
      top = rect.top - tipRect.height - 24;
      // 箭头位置：在提示框底部中央
      arrowLeft = rect.left + rect.width / 2 - 12; // 12px是箭头宽度的一半
      arrowTop = rect.top - 8; // 8px是箭头高度
      break;
    case 'bottom':
      left = rect.left + rect.width / 2 - tipRect.width / 2;
      top = rect.bottom + 24;
      // 箭头位置：在提示框顶部中央
      arrowLeft = rect.left + rect.width / 2 - 12; // 12px是箭头宽度的一半
      arrowTop = rect.bottom + 8; // 8px是箭头高度
      break;
    case 'left':
      left = rect.left - tipRect.width - 24;
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      // 箭头位置：在提示框右侧中央
      arrowLeft = rect.left - 8; // 8px是箭头宽度
      arrowTop = rect.top + rect.height / 2 - 12; // 12px是箭头高度的一半
      break;
    case 'right':
      left = rect.right + 24;
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      // 箭头位置：在提示框左侧中央
      arrowLeft = rect.right + 8; // 8px是箭头宽度
      arrowTop = rect.top + rect.height / 2 - 12; // 12px是箭头高度的一半
      break;
    default:
      // 默认使用top样式
      left = rect.left + rect.width / 2 - tipRect.width / 2;
      top = rect.top - tipRect.height - 24;
      arrowLeft = rect.left + rect.width / 2 - 12;
      arrowTop = rect.top - 8;
      break;
  }

  // 边界检查
  if (left < 10) {
    left = 10;
  }
  if (left + tipRect.width > window.innerWidth - 10) {
    left = window.innerWidth - tipRect.width - 10;
  }
  if (top < 10) {
    top = 10;
  }
  if (top + tipRect.height > window.innerHeight - 10) {
    top = window.innerHeight - tipRect.height - 10;
  }

  return { left, top, arrowLeft, arrowTop };
};

/**
 * 重新计算箭头位置（考虑边界调整，按原分支实现）
 */
export const recalculateArrowPosition = (
  arrowElement: HTMLDivElement,
  targetRect: Position & Size,
  tipRect: { width: number; height: number },
  position: { left: number; top: number },
  placement: GuideTipOptions['placement'] = 'top',
): void => {
  // 计算目标元素的中心位置
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  switch (placement) {
    case 'top':
      // 箭头指向目标元素的中心
      arrowElement.style.left = `${targetCenterX}px`;
      arrowElement.style.top = `${position.top + tipRect.height}px`;
      arrowElement.style.transform = 'translateX(-50%)';
      break;
    case 'bottom':
      // 箭头指向目标元素的中心
      arrowElement.style.left = `${targetCenterX}px`;
      arrowElement.style.top = `${position.top - 16}px`;
      arrowElement.style.transform = 'translateX(-50%)';
      arrowElement.style.borderTop = 'none';
      arrowElement.style.borderBottom = '16px solid #667eea';
      break;
    case 'left':
      // 箭头指向目标元素的中心
      arrowElement.style.left = `${position.left + tipRect.width}px`;
      arrowElement.style.top = `${targetCenterY}px`;
      arrowElement.style.transform = 'translateY(-50%)';
      arrowElement.style.borderTop = '12px solid transparent';
      arrowElement.style.borderBottom = '12px solid transparent';
      arrowElement.style.borderLeft = '16px solid #667eea';
      arrowElement.style.borderRight = 'none';
      break;
    case 'right':
      // 箭头指向目标元素的中心
      arrowElement.style.left = `${position.left - 16}px`;
      arrowElement.style.top = `${targetCenterY}px`;
      arrowElement.style.transform = 'translateY(-50%)';
      arrowElement.style.borderTop = '12px solid transparent';
      arrowElement.style.borderBottom = '12px solid transparent';
      arrowElement.style.borderRight = '16px solid #667eea';
      arrowElement.style.borderLeft = 'none';
      break;
    default:
      // 默认使用top样式
      arrowElement.style.left = `${targetCenterX}px`;
      arrowElement.style.top = `${position.top + tipRect.height}px`;
      arrowElement.style.transform = 'translateX(-50%)';
      break;
  }
};

/**
 * 清理已存在的引导提示
 */
export const cleanupExistingTips = (
  selector: string,
  content: string,
  placement: GuideTipOptions['placement'],
): void => {
  const existingTips = document.querySelectorAll('[data-guide-tip="true"]');
  existingTips.forEach((tip) => {
    if (tip.parentNode) {
      tip.parentNode.removeChild(tip);
    }
  });

  logger.info({
    message: '[GuideTip] 清理已存在的引导提示',
    data: {
      cleanedCount: existingTips.length,
      newSelector: selector,
      newContent: content,
      newPlacement: placement,
    },
    source: 'GuideTip',
    component: 'showGuideTip',
  });
};

/**
 * 验证目标元素是否存在
 */
export const validateTargetElement = (selector: string): Element | null => {
  const targetElement = document.querySelector(selector);
  if (!targetElement) {
    logger.warn({
      message: '[GuideTip] 目标元素不存在，无法显示引导提示',
      data: { selector },
      source: 'GuideTip',
      component: 'showGuideTip',
    });
    return null;
  }

  // 添加详细的元素调试信息
  const allMatchingElements = document.querySelectorAll(selector);
  logger.info({
    message: '[GuideTip] 目标元素调试信息',
    data: {
      selector,
      targetElement: {
        tagName: targetElement.tagName,
        className: targetElement.className,
        id: targetElement.id,
        textContent: targetElement.textContent?.trim(),
        innerHTML: targetElement.innerHTML,
        boundingRect: targetElement.getBoundingClientRect(),
      },
      allMatchingElements: Array.from(allMatchingElements).map((el, index) => ({
        index,
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        textContent: el.textContent?.trim(),
        boundingRect: el.getBoundingClientRect(),
      })),
    },
    source: 'GuideTip',
    component: 'showGuideTip',
  });

  return targetElement;
};
