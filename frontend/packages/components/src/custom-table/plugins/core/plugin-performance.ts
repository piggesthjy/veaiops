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

import type { PluginPerformanceMetrics } from '@/custom-table/types';
/**
 * 插件性能监控模块
 * 负责插件性能指标的收集和分析
 *

 * @date 2025-12-19
 */
import { PluginStatusEnum } from '@/custom-table/types/core/enums';
import type { PluginRegistry } from './plugin-registry';

/**
 * @name 插件性能监控器
 */
export class PluginPerformanceMonitor {
  constructor(private registry: PluginRegistry) {}

  /**
   * @name 获取性能指标
   */
  getPerformanceMetrics(): PluginPerformanceMetrics {
    const plugins = this.registry.getPlugins();
    const metrics: PluginPerformanceMetrics = {
      totalPlugins: plugins.length,
      enabledPlugins: plugins.filter((p) => p.enabled).length,
      disabledPlugins: plugins.filter((p) => !p.enabled).length,
      activePlugins: 0,
      totalInstallTime: 0,
      totalSetupTime: 0,
      totalRenderTime: 0,
      averageInstallTime: 0,
      averageSetupTime: 0,
      averageRenderTime: 0,
      errorCount: 0,
      pluginDetails: {},
    };

    plugins.forEach((plugin) => {
      const instance = this.registry.getInstance(plugin.name);
      if (instance) {
        const { performance } = instance;

        metrics.totalInstallTime += performance.installTime;
        metrics.totalSetupTime += performance.setupTime;
        metrics.totalRenderTime += performance.renderTime;

        metrics.pluginDetails[plugin.name] = {
          status: (() => {
            if (instance.status === PluginStatusEnum.ACTIVE) {
              return 'active';
            }
            if (instance.status === PluginStatusEnum.INACTIVE) {
              return 'inactive';
            }
            return 'error';
          })(),
          installTime: performance.installTime,
          setupTime: performance.setupTime,
          renderTime: performance.renderTime,
          errorCount: instance.error ? 1 : 0,
          lastError: instance.error,
        };

        if (instance.status === PluginStatusEnum.ACTIVE) {
          metrics.activePlugins++;
        }

        if (instance.error) {
          metrics.errorCount++;
        }
      }
    });

    // 计算平均值
    if (plugins.length > 0) {
      metrics.averageInstallTime = metrics.totalInstallTime / plugins.length;
      metrics.averageSetupTime = metrics.totalSetupTime / plugins.length;
      metrics.averageRenderTime = metrics.totalRenderTime / plugins.length;
    }

    return metrics;
  }

  /**
   * @name 获取性能报告
   */
  getPerformanceReport(): string {
    const metrics = this.getPerformanceMetrics();

    const report = [
      '=== 插件性能报告 ===',
      `总插件数: ${metrics.totalPlugins}`,
      `已启用: ${metrics.enabledPlugins}`,
      `已禁用: ${metrics.disabledPlugins}`,
      '',
      '=== 性能指标 ===',
      `总安装时间: ${metrics.totalInstallTime.toFixed(2)}ms`,
      `总设置时间: ${metrics.totalSetupTime.toFixed(2)}ms`,
      `总渲染时间: ${metrics.totalRenderTime.toFixed(2)}ms`,
      `平均安装时间: ${metrics.averageInstallTime.toFixed(2)}ms`,
      `平均设置时间: ${metrics.averageSetupTime.toFixed(2)}ms`,
      `平均渲染时间: ${metrics.averageRenderTime.toFixed(2)}ms`,
      '',
      '=== 插件详情 ===',
    ];

    Object.entries(metrics.pluginDetails).forEach(([name, details]) => {
      const pluginDetails = details as {
        installTime: number;
        setupTime: number;
        renderTime: number;
        errorCount: number;
        lastError?: Error;
        status: string;
      };
      report.push(`${name}:`);
      report.push(`  状态: ${pluginDetails.status}`);
      report.push(`  安装时间: ${pluginDetails.installTime.toFixed(2)}ms`);
      report.push(`  设置时间: ${pluginDetails.setupTime.toFixed(2)}ms`);
      report.push(`  渲染时间: ${pluginDetails.renderTime.toFixed(2)}ms`);
      if (pluginDetails.errorCount > 0) {
        report.push(`  错误次数: ${pluginDetails.errorCount}`);
        if (pluginDetails.lastError) {
          report.push(`  最后错误: ${pluginDetails.lastError.message}`);
        }
      }
      report.push('');
    });

    return report.join('\n');
  }

  /**
   * @name 检查性能问题
   */
  checkPerformanceIssues(): string[] {
    const metrics = this.getPerformanceMetrics();
    const issues: string[] = [];

    // 检查安装时间过长的插件
    Object.entries(metrics.pluginDetails).forEach(([name, details]) => {
      const pluginDetails = details as {
        installTime: number;
        setupTime: number;
        renderTime: number;
        errorCount: number;
        lastError?: Error;
      };
      if (pluginDetails.installTime > 100) {
        issues.push(
          `插件 "${name}" 安装时间过长 (${pluginDetails.installTime.toFixed(
            2,
          )}ms)`,
        );
      }

      if (pluginDetails.setupTime > 50) {
        issues.push(
          `插件 "${name}" 设置时间过长 (${pluginDetails.setupTime.toFixed(
            2,
          )}ms)`,
        );
      }

      if (pluginDetails.renderTime > 16) {
        // 16ms = 60fps
        issues.push(
          `插件 "${name}" 渲染时间过长 (${pluginDetails.renderTime.toFixed(
            2,
          )}ms)`,
        );
      }

      if (pluginDetails.errorCount > 0) {
        issues.push(
          `插件 "${name}" 存在错误: ${
            pluginDetails.lastError?.message || '未知错误'
          }`,
        );
      }
    });

    return issues;
  }

  /**
   * @name 重置性能数据
   */
  resetPerformanceData(): void {
    const plugins = this.registry.getPlugins();

    plugins.forEach((plugin) => {
      const instance = this.registry.getInstance(plugin.name);
      if (instance) {
        instance.performance = {
          installTime: 0,
          setupTime: 0,
          renderTime: 0,
          lastExecutionTime: 0,
        };
        instance.error = undefined;
      }
    });
  }
}
