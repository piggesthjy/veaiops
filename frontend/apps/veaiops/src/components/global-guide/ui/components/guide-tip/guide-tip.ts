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
 * 美观的引导提示组件核心逻辑
 * 采用模块化设计，专注于主要功能实现
 */

import { logger } from '@veaiops/utils';
import type { GuideTipOptions } from './types';
import {
  calculateTipPosition,
  cleanupExistingTips,
  createTipContainer,
  getElementRect,
  recalculateArrowPosition,
  validateTargetElement,
} from './utils';

/**
 * 显示美观的引导提示
 * 基于原分支功能实现，适配当前模块化结构
 */
export const showGuideTip = (options: GuideTipOptions): (() => void) => {
  const {
    content,
    selector,
    placement = 'top',
    showArrow = true,
    customStyle = {},
    buttonText = '知道了',
    autoClose = false,
    autoCloseDelay = 5000,
    closeOnOutsideClick = true,
    onClose,
  } = options;

  try {
    // 立即记录函数调用
    logger.info({
      message: '[GuideTip] showGuideTip 函数被调用',
      data: {
        selector,
        content,
        placement,
        timestamp: new Date().toISOString(),
      },
      source: 'GuideTip',
      component: 'showGuideTip',
    });

    // 清理已存在的引导提示
    cleanupExistingTips(selector, content, placement);

    // 验证目标元素
    const targetElement = validateTargetElement(selector);
    if (!targetElement) {
      return () => {
        // 空清理函数，当目标元素不存在时
      };
    }

    // 获取目标元素位置和尺寸
    const targetRect = getElementRect(targetElement);

    // 创建提示框容器和元素
    const { tipContainer, tipElement, closeButton, arrowElement } =
      createTipContainer(options);

    // 添加到页面
    document.body.appendChild(tipContainer);

    // 添加点击外部区域关闭功能
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Element;
      // 如果点击的不是tip容器内的元素，则关闭tip
      if (!tipContainer.contains(target)) {
        cleanup();
      }
    };

    // 监听点击事件（如果启用）
    if (closeOnOutsideClick) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    // 定位提示框
    const rect = targetElement.getBoundingClientRect();
    const tipRect = tipElement.getBoundingClientRect();

    // 添加定位调试信息
    logger.info({
      message: '[GuideTip] 定位计算调试信息',
      data: {
        selector,
        content,
        placement,
        targetRect: {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          centerX: rect.left + rect.width / 2,
          centerY: rect.top + rect.height / 2,
        },
        tipRect: {
          width: tipRect.width,
          height: tipRect.height,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      source: 'GuideTip',
      component: 'showGuideTip',
    });

    // 计算位置（包含箭头初始位置）
    const position = calculateTipPosition(targetRect, tipElement, placement);
    tipElement.style.left = `${position.left}px`;
    tipElement.style.top = `${position.top}px`;

    // 添加最终定位结果调试信息
    logger.info({
      message: '[GuideTip] 最终定位结果',
      data: {
        selector,
        content,
        placement,
        finalPosition: {
          left: position.left,
          top: position.top,
          arrowLeft: position.arrowLeft,
          arrowTop: position.arrowTop,
        },
        targetElement: {
          tagName: targetElement.tagName,
          textContent: targetElement.textContent?.trim(),
          boundingRect: targetElement.getBoundingClientRect(),
        },
      },
      source: 'GuideTip',
      component: 'showGuideTip',
    });

    // 重新计算箭头位置（考虑边界调整）
    if (arrowElement && showArrow) {
      recalculateArrowPosition(
        arrowElement,
        targetRect,
        tipRect,
        position,
        placement,
      );
    }

    // 添加进入动画
    tipElement.style.opacity = '0';
    tipElement.style.transform = 'translateY(-20px) scale(0.9)';
    tipElement.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

    // 箭头也添加进入动画
    if (arrowElement) {
      const currentTransform = arrowElement.style.transform || '';
      arrowElement.style.opacity = '0';
      arrowElement.style.transform = `${currentTransform} scale(0.9)`;
      arrowElement.style.transition =
        'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }

    requestAnimationFrame(() => {
      tipElement.style.opacity = '1';
      tipElement.style.transform = 'translateY(0) scale(1)';

      // 箭头也同时显示
      if (arrowElement) {
        arrowElement.style.opacity = '1';
        const currentTransform = arrowElement.style.transform || '';
        arrowElement.style.transform = currentTransform.replace(
          ' scale(0.9)',
          '',
        );
      }
    });

    // 清理函数
    const cleanup = () => {
      // 移除事件监听器（如果添加了）
      if (closeOnOutsideClick) {
        document.removeEventListener('mousedown', handleOutsideClick);
      }

      // 同时为tip和箭头添加退出动画
      tipElement.style.opacity = '0';
      tipElement.style.transform = 'translateY(-20px) scale(0.9)';

      // 箭头也同时添加退出动画
      if (arrowElement) {
        const currentTransform = arrowElement.style.transform || '';
        arrowElement.style.opacity = '0';
        arrowElement.style.transform = `${currentTransform} scale(0.9)`;
        arrowElement.style.transition =
          'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }

      setTimeout(() => {
        if (tipContainer.parentNode) {
          tipContainer.parentNode.removeChild(tipContainer);
        }
        if (onClose) {
          onClose();
        }
      }, 400);
    };

    // 设置按钮点击
    if (closeButton) {
      closeButton.onclick = cleanup;
    }

    // 自动关闭（如果启用）
    if (autoClose) {
      setTimeout(cleanup, autoCloseDelay);
    }

    logger.info({
      message: '[GuideTip] 美观的引导提示已显示',
      data: { selector, content, placement, autoClose, closeOnOutsideClick },
      source: 'GuideTip',
      component: 'showGuideTip',
    });

    return cleanup;
  } catch (error) {
    logger.error({
      message: '[GuideTip] 显示引导提示失败',
      data: {
        error: error instanceof Error ? error.message : String(error),
        selector,
        content,
      },
      source: 'GuideTip',
      component: 'showGuideTip',
    });
    return () => {
      // 空的清理函数
    };
  }
};
