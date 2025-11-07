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

import { logger } from '@veaiops/utils';
import type { DOMAnalysis } from './types';

/**
 * 检查元素是否可见
 */
function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const htmlElement = element as HTMLElement;
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    htmlElement.offsetWidth > 0 &&
    htmlElement.offsetHeight > 0
  );
}

/**
 * 分析 DOM 状态
 */
export function analyzeDOM(): DOMAnalysis {
  const analysis: DOMAnalysis = {
    guideElements: [],
    visibleElements: [],
    issues: [],
  };

  try {
    // 查找所有可能的引导元素
    const selectors = [
      '[class*="global-guide"]',
      '[class*="guide"]',
      '[id*="guide"]',
      '[data-testid*="guide"]',
    ];

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const elementInfo = {
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          style: {
            display: (el as HTMLElement).style.display,
            visibility: (el as HTMLElement).style.visibility,
            opacity: (el as HTMLElement).style.opacity,
          },
          computedStyle: {
            display: window.getComputedStyle(el).display,
            visibility: window.getComputedStyle(el).visibility,
            opacity: window.getComputedStyle(el).opacity,
          },
          visible: isElementVisible(el),
        };

        analysis.guideElements.push(elementInfo);

        if (elementInfo.visible) {
          analysis.visibleElements.push(elementInfo);
          analysis.issues.push({
            type: 'visible_guide_element',
            message: '发现可见的引导元素',
            severity: 'high',
            element: elementInfo,
          });
        }
      });
    });
  } catch (error: unknown) {
    // ✅ 正确：透出实际的错误信息
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorMessage = errorObj.message || 'DOM 分析失败';
    analysis.issues.push({
      type: 'dom_analysis_error',
      message: `DOM 分析失败: ${errorMessage}`,
      severity: 'error',
      error: (error as Error).message,
    });
  }

  return analysis;
}

/**
 * 记录初始状态
 */
export function logInitialState(): void {
  try {
    // 检查全局引导 store 状态
    const guideStore = localStorage.getItem('global-guide-store');
    if (guideStore) {
      const parsed = JSON.parse(guideStore);
      logger.info({
        message: '全局引导 Store 状态',
        data: {
          store: parsed,
          hasGuideVisible: 'state' in parsed && 'guideVisible' in parsed.state,
          guideVisibleValue: parsed.state?.guideVisible,
        },
        source: 'GlobalGuideAnalyzer',
      });
    } else {
      // ✅ 正确：使用 logger 记录信息，data 参数应为对象或 undefined
      logger.info({
        message: '全局引导 Store 不存在',
        data: undefined,
        source: 'GlobalGuideAnalyzer',
      });
    }

    // 检查当前 URL 和路由
    logger.info({
      message: '当前页面状态',
      data: {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      },
      source: 'GlobalGuideAnalyzer',
      component: 'logInitialState',
    });

    // 检查是否有全局引导组件相关的 DOM 元素
    const guideElements = document.querySelectorAll(
      '[class*="global-guide"], [class*="guide"]',
    );
    logger.info({
      message: 'DOM 中的引导元素',
      data: {
        elementCount: guideElements.length,
        elements: Array.from(guideElements).map((el) => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          visible:
            (el as HTMLElement).style.display !== 'none' &&
            (el as HTMLElement).style.visibility !== 'hidden',
        })),
      },
      source: 'GlobalGuideAnalyzer',
      component: 'logInitialState',
    });

    // 检查 React DevTools 中的组件状态（如果可用）
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      logger.info({
        message: 'React DevTools 可用',
        data: {
          version: (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.version,
        },
        source: 'GlobalGuideAnalyzer',
        component: 'logInitialState',
      });
    }
  } catch (error: unknown) {
    // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({
      message: '记录初始状态失败',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
      },
      source: 'GlobalGuideAnalyzer',
      component: 'logInitialState',
    });
  }
}
