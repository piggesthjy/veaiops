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

import React from 'react';

/**
 * 性能监控工具
 * 用于监控应用性能指标和优化建议
 */

interface PerformanceMetrics {
  /** 页面加载时间 */
  loadTime: number;
  /** 首次内容绘制时间 */
  fcp: number;
  /** 最大内容绘制时间 */
  lcp: number;
  /** 累积布局偏移 */
  cls: number;
  /** 首次输入延迟 */
  fid: number;
}

interface ComponentPerformance {
  /** 组件名称 */
  name: string;
  /** 渲染时间 */
  renderTime: number;
  /** 重新渲染次数 */
  rerenderCount: number;
  /** 最后更新时间 */
  lastUpdate: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private componentMetrics: Map<string, ComponentPerformance> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  /**
   * 初始化性能观察器
   */
  private initializeObservers() {
    if (typeof window === 'undefined') {
      return;
    }

    // 观察导航时间
    if ('PerformanceObserver' in window) {
      try {
        // 观察页面加载性能
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.metrics.loadTime =
                navEntry.loadEventEnd - navEntry.fetchStart;
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);

        // 观察绘制性能
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // 观察最大内容绘制
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        // PerformanceObserver 初始化失败（浏览器不支持或权限问题），静默处理
      }
    }
  }

  /**
   * 记录组件性能
   */
  recordComponentPerformance({
    componentName,
    renderTime,
  }: {
    componentName: string;
    renderTime: number;
  }) {
    const existing = this.componentMetrics.get(componentName);
    if (existing) {
      existing.renderTime = renderTime;
      existing.rerenderCount += 1;
      existing.lastUpdate = Date.now();
    } else {
      this.componentMetrics.set(componentName, {
        name: componentName,
        renderTime,
        rerenderCount: 1,
        lastUpdate: Date.now(),
      });
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * 获取组件性能指标
   */
  getComponentMetrics(): ComponentPerformance[] {
    return Array.from(this.componentMetrics.values());
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const metrics = this.getMetrics();
    const componentMetrics = this.getComponentMetrics();

    // 性能评分
    const score = this.calculatePerformanceScore(metrics);

    // 优化建议
    const suggestions = this.generateOptimizationSuggestions(
      metrics,
      componentMetrics,
    );

    return {
      score,
      metrics,
      componentMetrics,
      suggestions,
      timestamp: Date.now(),
    };
  }

  /**
   * 计算性能评分 (0-100)
   */
  private calculatePerformanceScore(
    metrics: Partial<PerformanceMetrics>,
  ): number {
    let score = 100;

    // FCP 评分 (理想 < 1.8s)
    if (metrics.fcp) {
      if (metrics.fcp > 3000) {
        score -= 20;
      } else if (metrics.fcp > 1800) {
        score -= 10;
      }
    }

    // LCP 评分 (理想 < 2.5s)
    if (metrics.lcp) {
      if (metrics.lcp > 4000) {
        score -= 25;
      } else if (metrics.lcp > 2500) {
        score -= 15;
      }
    }

    // 加载时间评分 (理想 < 3s)
    if (metrics.loadTime) {
      if (metrics.loadTime > 5000) {
        score -= 20;
      } else if (metrics.loadTime > 3000) {
        score -= 10;
      }
    }

    return Math.max(0, score);
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(
    metrics: Partial<PerformanceMetrics>,
    componentMetrics: ComponentPerformance[],
  ): string[] {
    const suggestions: string[] = [];

    // 基于性能指标的建议
    if (metrics.fcp && metrics.fcp > 1800) {
      suggestions.push('首次内容绘制时间较长，建议优化关键资源加载');
    }

    if (metrics.lcp && metrics.lcp > 2500) {
      suggestions.push('最大内容绘制时间较长，建议优化图片和字体加载');
    }

    if (metrics.loadTime && metrics.loadTime > 3000) {
      suggestions.push('页面加载时间较长，建议启用代码分割和懒加载');
    }

    // 基于组件性能的建议
    const slowComponents = componentMetrics.filter((c) => c.renderTime > 100);
    if (slowComponents.length > 0) {
      suggestions.push(
        `发现 ${slowComponents.length} 个渲染较慢的组件，建议使用 React.memo 优化`,
      );
    }

    const frequentRerenders = componentMetrics.filter(
      (c) => c.rerenderCount > 10,
    );
    if (frequentRerenders.length > 0) {
      suggestions.push(
        `发现 ${frequentRerenders.length} 个频繁重渲染的组件，建议检查依赖项`,
      );
    }

    return suggestions;
  }

  /**
   * 清理观察器
   */
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor();

/**
 * React Hook 用于监控组件性能
 */
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = performance.now();

  return {
    recordRender: () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.recordComponentPerformance({
        componentName,
        renderTime,
      });
    },
  };
};

/**
 * 高阶组件用于自动监控组件性能
 */
export const withPerformanceMonitor = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string,
) => {
  const displayName =
    componentName || WrappedComponent.displayName || WrappedComponent.name;

  const MonitoredComponent: React.FC<P> = (props) => {
    const { recordRender } = usePerformanceMonitor(displayName);

    React.useEffect(() => {
      recordRender();
    });

    return React.createElement(WrappedComponent, props);
  };

  MonitoredComponent.displayName = `withPerformanceMonitor(${displayName})`;
  return MonitoredComponent;
};
