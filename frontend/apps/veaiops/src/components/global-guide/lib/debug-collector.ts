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
 * 调试日志收集器
 * 专门用于收集新建连接功能的调试日志
 */

import { exportLogsToFile, logger } from '@veaiops/utils';

/**
 * 收集新建连接相关的所有日志
 */
export const collectNewConnectionLogs = () => {
  const startTime = Date.now();

  logger.info({
    message: '[DebugLogCollector] 开始收集新建连接功能日志',
    data: {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    },
    source: 'DebugLogCollector',
    component: 'collectNewConnectionLogs',
  });

  // 检查页面状态
  const pageInfo = {
    url: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    title: document.title,
  };

  // 检查目标按钮状态
  const targetButton = document.querySelector(
    '[data-testid="new-connection-btn"]',
  );
  const buttonInfo = targetButton
    ? {
        exists: true,
        tagName: targetButton.tagName,
        textContent: targetButton.textContent,
        className: targetButton.className,
        visible: (targetButton as HTMLElement).offsetParent !== null,
        rect: targetButton.getBoundingClientRect(),
        computedStyle: window.getComputedStyle(targetButton),
      }
    : {
        exists: false,
      };

  // 检查所有相关按钮
  const allButtons = document.querySelectorAll('button');
  const allTestIds = document.querySelectorAll('[data-testid]');
  const connectionButtons = Array.from(allButtons).filter(
    (btn) =>
      btn.textContent?.includes('新建') ||
      btn.textContent?.includes('连接') ||
      btn.getAttribute('data-testid')?.includes('connection'),
  );

  const debugInfo = {
    pageInfo,
    buttonInfo,
    allButtonsCount: allButtons.length,
    allTestIdsCount: allTestIds.length,
    connectionButtons: connectionButtons.map((btn) => ({
      text: btn.textContent,
      testId: btn.getAttribute('data-testid'),
      classes: btn.className,
      visible: (btn as HTMLElement).offsetParent !== null,
    })),
    allTestIds: Array.from(allTestIds).map((el) => ({
      testId: el.getAttribute('data-testid'),
      tagName: el.tagName,
      text: el.textContent,
    })),
  };

  logger.info({
    message: '[DebugLogCollector] 页面状态检查完成',
    data: debugInfo,
    source: 'DebugLogCollector',
    component: 'pageCheck',
  });

  // 检查全局引导系统状态
  const guideElements = document.querySelectorAll('[data-x-guide]');
  const guideInfo = {
    guideElementsCount: guideElements.length,
    guideElements: Array.from(guideElements).map((el) => ({
      testId: el.getAttribute('data-testid'),
      tagName: el.tagName,
      text: el.textContent,
    })),
  };

  logger.info({
    message: '[DebugLogCollector] 全局引导系统状态检查完成',
    data: guideInfo,
    source: 'DebugLogCollector',
    component: 'guideCheck',
  });

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  logger.info({
    message: '[DebugLogCollector] 新建连接功能日志收集完成',
    data: {
      totalTime,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    },
    source: 'DebugLogCollector',
    component: 'collectComplete',
  });

  return {
    debugInfo,
    guideInfo,
    totalTime,
  };
};

/**
 * 导出所有相关日志
 */
export const exportNewConnectionLogs = () => {
  logger.info({
    message: '[DebugLogCollector] 导出新建连接功能日志',
    data: {
      url: window.location.href,
      timestamp: new Date().toISOString(),
    },
    source: 'DebugLogCollector',
    component: 'exportLogs',
  });

  // 先收集当前状态
  collectNewConnectionLogs();

  // 导出所有日志
  exportLogsToFile(
    `new-connection-debug-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, '-')}.log`,
  );
};

/**
 * 在控制台输出调试信息
 */
export const logDebugInfo = () => {
  const info = collectNewConnectionLogs();
  return info;
};

/**
 * 检查是否在数据源管理页面
 */
const isDataSourcePage = (url: string): boolean => {
  return url.includes('/system/datasource') || url.includes('datasource');
};

/**
 * 增强的日志收集（针对数据源管理页面）
 */
const collectEnhancedLogs = () => {
  const url = window.location.href;

  logger.info({
    message: '[DebugLogCollector] 执行增强日志收集',
    data: {
      url,
      isDataSourcePage: isDataSourcePage(url),
      timestamp: new Date().toISOString(),
    },
    source: 'DebugLogCollector',
    component: 'collectEnhancedLogs',
  });

  // 基础日志收集
  collectNewConnectionLogs();

  // 如果是数据源管理页面，进行增强收集
  if (isDataSourcePage(url)) {
    logger.info({
      message: '[DebugLogCollector] 检测到数据源管理页面，执行增强收集',
      data: {
        url,
        timestamp: new Date().toISOString(),
      },
      source: 'DebugLogCollector',
      component: 'enhancedCollection',
    });

    // 检查连接管理抽屉状态
    const connectDrawerShow = new URLSearchParams(window.location.search).get(
      'connectDrawerShow',
    );

    // 检查所有连接面板
    const connectionPanels = document.querySelectorAll(
      '[class*="connection-panel"]',
    );
    const connectionHeaders = document.querySelectorAll(
      '[class*="connection-panel-header"]',
    );

    // 检查新建连接按钮的详细状态
    const newConnectionButtons = document.querySelectorAll(
      '[data-testid="new-connection-btn"]',
    );

    const enhancedInfo = {
      connectDrawerShow,
      connectionPanelsCount: connectionPanels.length,
      connectionHeadersCount: connectionHeaders.length,
      newConnectionButtonsCount: newConnectionButtons.length,
      newConnectionButtons: Array.from(newConnectionButtons).map((btn) => ({
        text: btn.textContent,
        classes: btn.className,
        visible: (btn as HTMLElement).offsetParent !== null,
        rect: btn.getBoundingClientRect(),
        parentElement: btn.parentElement?.tagName,
        parentClasses: btn.parentElement?.className,
      })),
    };

    logger.info({
      message: '[DebugLogCollector] 数据源页面增强信息收集完成',
      data: enhancedInfo,
      source: 'DebugLogCollector',
      component: 'enhancedInfoCollected',
    });
  }
};

/**
 * 页面初始化时自动收集日志
 * @returns 清理函数，用于停止自动收集
 */
export const initAutoLogCollection = (): (() => void) | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  logger.info({
    message: '[DebugLogCollector] 初始化自动日志收集',
    data: {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    },
    source: 'DebugLogCollector',
    component: 'initAutoLogCollection',
  });

  // 页面加载完成后的延迟收集
  const collectOnLoad = () => {
    setTimeout(() => {
      logger.info({
        message: '[DebugLogCollector] 页面加载完成，开始自动收集日志',
        data: {
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
        source: 'DebugLogCollector',
        component: 'autoCollectOnLoad',
      });

      collectEnhancedLogs();
    }, 1000); // 延迟1秒确保DOM完全渲染
  };

  // 监听页面加载事件
  if (document.readyState === 'complete') {
    collectOnLoad();
  } else {
    window.addEventListener('load', collectOnLoad);
  }

  // 监听路由变化（SPA应用）
  let currentUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;

      logger.info({
        message: '[DebugLogCollector] 检测到路由变化，重新收集日志',
        data: {
          newUrl: currentUrl,
          timestamp: new Date().toISOString(),
        },
        source: 'DebugLogCollector',
        component: 'autoCollectOnRouteChange',
      });

      // 延迟收集，确保新页面内容已加载
      setTimeout(() => {
        collectEnhancedLogs();
      }, 500);
    }
  };

  // 定期检查URL变化
  const urlCheckInterval = setInterval(checkUrlChange, 1000);

  // 监听popstate事件（浏览器前进后退）
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      logger.info({
        message: '[DebugLogCollector] 检测到浏览器导航，重新收集日志',
        data: {
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
        source: 'DebugLogCollector',
        component: 'autoCollectOnPopState',
      });

      collectEnhancedLogs();
    }, 500);
  });

  // 监听pushstate/replacestate（程序化导航）
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    setTimeout(() => {
      logger.info({
        message: '[DebugLogCollector] 检测到pushState导航，重新收集日志',
        data: {
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
        source: 'DebugLogCollector',
        component: 'autoCollectOnPushState',
      });

      collectEnhancedLogs();
    }, 500);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => {
      logger.info({
        message: '[DebugLogCollector] 检测到replaceState导航，重新收集日志',
        data: {
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
        source: 'DebugLogCollector',
        component: 'autoCollectOnReplaceState',
      });

      collectEnhancedLogs();
    }, 500);
  };

  // 清理函数
  const cleanup = () => {
    clearInterval(urlCheckInterval);
    window.removeEventListener('load', collectOnLoad);
    window.removeEventListener('popstate', checkUrlChange);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };

  // 页面卸载时清理
  window.addEventListener('beforeunload', cleanup);

  logger.info({
    message: '[DebugLogCollector] 自动日志收集已启动',
    data: {
      url: window.location.href,
      timestamp: new Date().toISOString(),
    },
    source: 'DebugLogCollector',
    component: 'autoCollectionStarted',
  });

  return cleanup;
};

/**
 * 停止自动日志收集
 */
export const stopAutoLogCollection = (cleanup: () => void) => {
  if (cleanup) {
    cleanup();
    logger.info({
      message: '[DebugLogCollector] 自动日志收集已停止',
      data: {
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      source: 'DebugLogCollector',
      component: 'autoCollectionStopped',
    });
  }
};

// 将调试函数挂载到全局对象，方便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).debugNewConnection = {
    collectLogs: collectNewConnectionLogs,
    exportLogs: exportNewConnectionLogs,
    logInfo: logDebugInfo,
    initAutoCollection: initAutoLogCollection,
    stopAutoCollection: stopAutoLogCollection,
  };

  // 自动启动日志收集
  const cleanup = initAutoLogCollection();
  (window as any).debugNewConnection._cleanup = cleanup;
}
