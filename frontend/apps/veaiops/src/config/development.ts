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
 * 开发体验优化配置
 * 提供开发环境下的调试工具和性能监控
 */

import { memoryCache } from '@/utils/cache-manager';
import { performanceMonitor } from '@/utils/performance-monitor';
import React from 'react';

interface DevToolsConfig {
  /** 是否启用性能监控 */
  enablePerformanceMonitoring: boolean;
  /** 是否启用缓存调试 */
  enableCacheDebugging: boolean;
  /** 是否启用组件渲染追踪 */
  enableRenderTracking: boolean;
  /** 是否启用网络请求日志 */
  enableNetworkLogging: boolean;
  /** 是否启用错误边界调试 */
  enableErrorBoundaryDebugging: boolean;
}

class DevelopmentTools {
  private config: DevToolsConfig;
  private renderTracker: Map<string, number> = new Map<string, number>();

  constructor(config: Partial<DevToolsConfig> = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableCacheDebugging: true,
      enableRenderTracking: true,
      enableNetworkLogging: true,
      enableErrorBoundaryDebugging: true,
      ...config,
    };

    this.initialize();
  }

  /**
   * 初始化开发工具
   */
  private initialize() {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // 添加全局调试方法
    this.addGlobalDebugMethods();

    // 启用性能监控
    if (this.config.enablePerformanceMonitoring) {
      this.enablePerformanceMonitoring();
    }

    // 启用缓存调试
    if (this.config.enableCacheDebugging) {
      this.enableCacheDebugging();
    }

    // 启用网络请求日志
    if (this.config.enableNetworkLogging) {
      this.enableNetworkLogging();
    }

    // 启用错误边界调试
    if (this.config.enableErrorBoundaryDebugging) {
      this.enableErrorBoundaryDebugging();
    }
  }

  /**
   * 添加全局调试方法
   */
  private addGlobalDebugMethods() {
    if (typeof window === 'undefined') {
      return;
    }

    // 添加到 window 对象
    (window as any).__VOLCAIOPS_DEBUG__ = {
      // 获取性能报告
      getPerformanceReport: () => performanceMonitor.getPerformanceReport(),

      // 获取缓存统计
      getCacheStats: () => memoryCache.getStats(),

      // 清理缓存
      clearCache: () => memoryCache.clear(),

      // 获取渲染统计
      getRenderStats: () => Array.from(this.renderTracker.entries()),

      // 清理渲染统计
      clearRenderStats: () => this.renderTracker.clear(),

      // 模拟慢网络
      simulateSlowNetwork: (delay = 2000) => {
        this.simulateNetworkDelay(delay);
      },

      // 触发错误测试
      triggerError: (message = 'Test error') => {
        throw new Error(message);
      },
    };
  }

  /**
   * 启用性能监控
   */
  private enablePerformanceMonitoring() {
    // 定期输出性能报告
    setInterval(() => {
      const report = performanceMonitor.getPerformanceReport();
      if (report.score < 80) {
        // 性能分数低于80时输出警告
        console.warn('[Performance] Low performance score:', report.score);
      }
    }, 30000); // 每30秒检查一次
  }

  /**
   * 启用缓存调试
   */
  private enableCacheDebugging() {
    // 定期输出缓存统计
    setInterval(() => {
      memoryCache.getStats();
    }, 60000); // 每分钟输出一次
  }

  /**
   * 启用网络请求日志
   */
  private enableNetworkLogging() {
    if (typeof window === 'undefined') {
      return;
    }

    // 拦截 fetch 请求
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] instanceof Request ? args[0].url : args[0];

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        throw errorObj;
      }
    };
  }

  /**
   * 启用错误边界调试
   */
  private enableErrorBoundaryDebugging() {
    // 监听未捕获的错误
    window.addEventListener('error', (event) => {
      console.error('[DevTools] === 未捕获的错误 ===');
      console.error('[DevTools] Error:', event.error);
      console.error('[DevTools] Message:', event.message);
      console.error('[DevTools] Filename:', event.filename);
      console.error('[DevTools] Line:', event.lineno);
    });

    // 监听未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[DevTools] === 未处理的 Promise 拒绝 ===');
      console.error('[DevTools] Reason:', event.reason);
    });
  }

  /**
   * 模拟网络延迟
   */
  private simulateNetworkDelay(delay: number) {
    if (typeof window === 'undefined') {
      return;
    }

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return originalFetch(...args);
    };

    // 5分钟后自动恢复
    setTimeout(
      () => {
        window.fetch = originalFetch;
      },
      5 * 60 * 1000,
    );
  }

  /**
   * 记录组件渲染
   */
  trackComponentRender(componentName: string) {
    if (!this.config.enableRenderTracking) {
      return;
    }

    const count = this.renderTracker.get(componentName) || 0;
    this.renderTracker.set(componentName, count + 1);

    // 如果渲染次数过多，发出警告
    if (count > 10) {
      console.warn(
        `[Performance] Component ${componentName} rendered ${count} times`,
      );
    }
  }

  /**
   * 获取配置
   */
  getConfig(): DevToolsConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<DevToolsConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// 创建开发工具实例
export const devTools = new DevelopmentTools();

/**
 * React Hook 用于组件渲染追踪
 */
export const useRenderTracker = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    devTools.trackComponentRender(componentName);
  }
};

/**
 * 高阶组件用于自动追踪组件渲染
 */
export const withRenderTracker = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string,
) => {
  if (process.env.NODE_ENV !== 'development') {
    return WrappedComponent;
  }

  const displayName =
    componentName || WrappedComponent.displayName || WrappedComponent.name;

  const TrackedComponent: React.FC<P> = (props) => {
    useRenderTracker(displayName);
    return React.createElement(WrappedComponent, props);
  };

  TrackedComponent.displayName = `withRenderTracker(${displayName})`;
  return TrackedComponent;
};

/**
 * 开发环境专用的日志工具
 */
export const devLog = {
  info: (_message: string, ..._args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[DevLog] ${_message}`, ..._args);
    }
    // Production environment - no logging
  },

  warn: (_message: string, ..._args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(_message, ..._args);
    }
    // Production environment - no logging
  },

  error: (_message: string, ..._args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(_message, ..._args);
    }
    // Production environment - no logging
  },

  group: (label: string) => {
    // console.log 已移除
  },

  groupEnd: () => {
    // console.log 已移除
  },
};
