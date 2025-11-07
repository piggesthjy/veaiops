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
 * Filters 组件日志收集器
 * 🚀 增强版：集成 @veaiops/utils logger 和 log-exporter
 */

import { logger, startLogCollection } from '@veaiops/utils';

interface FilterLogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  data?: unknown;
}

/**
 * 记录日志的参数接口
 */
interface LogParams {
  level: FilterLogEntry['level'];
  component: string;
  message: string;
  data?: unknown;
}

/**
 * 记录信息日志的参数接口
 */
interface InfoWarnErrorDebugParams {
  component: string;
  message: string;
  data?: unknown;
}

/**
 * 记录日志的参数接口
 */
interface LogParams {
  level: FilterLogEntry['level'];
  component: string;
  message: string;
  data?: unknown;
}

/**
 * 记录信息日志的参数接口
 */
interface InfoWarnErrorDebugParams {
  component: string;
  message: string;
  data?: unknown;
}

class FilterLogger {
  private logs: FilterLogEntry[] = [];
  private enabled = false;

  /**
   * 启用日志收集
   */
  enable(): void {
    this.enabled = true;
    this.logs = [];
  }

  /**
   * 禁用日志收集
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * 记录日志
   * ✅ 优化：统一使用 @veaiops/utils logger，移除重复的 console 输出
   * logger 内部已处理 console 输出和时间戳格式化
   */
  log({ level, component, message, data }: LogParams): void {
    if (!this.enabled) {
      return;
    }

    const entry: FilterLogEntry = {
      timestamp: Date.now(),
      level,
      component,
      message,
      data,
    };

    this.logs.push(entry);

    // ✅ 统一使用 @veaiops/utils logger（logger 内部已处理 console 输出）
    const logData = data ? { data } : undefined;
    switch (level) {
      case 'error':
        logger.error({
          message,
          data: logData,
          source: 'Filters',
          component,
        });
        break;
      case 'warn':
        logger.warn({
          message,
          data: logData,
          source: 'Filters',
          component,
        });
        break;
      case 'debug':
        logger.debug({
          message,
          data: logData,
          source: 'Filters',
          component,
        });
        break;
      default:
        logger.info({
          message,
          data: logData,
          source: 'Filters',
          component,
        });
        break;
    }
  }

  /**
   * 获取所有日志
   */
  getLogs(): FilterLogEntry[] {
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }

  info({ component, message, data }: InfoWarnErrorDebugParams): void {
    this.log({ level: 'info', component, message, data });
  }

  warn({ component, message, data }: InfoWarnErrorDebugParams): void {
    this.log({ level: 'warn', component, message, data });
  }

  error({ component, message, data }: InfoWarnErrorDebugParams): void {
    this.log({ level: 'error', component, message, data });
  }

  debug({ component, message, data }: InfoWarnErrorDebugParams): void {
    this.log({ level: 'debug', component, message, data });
  }
}

// 创建全局实例
export const filterLogger = new FilterLogger();

// 开发环境下启用并暴露到全局
if (typeof window !== 'undefined') {
  filterLogger.enable();

  // 暴露日志获取接口给统一日志导出系统
  (window as any).getFiltersLogs = () => {
    return filterLogger.getLogs();
  };

  // 🚀 新增：统一日志导出接口
  if (!(window as any).exportAllComponentLogs) {
    (window as any).exportAllComponentLogs = () => {
      console.group('📦 收集所有组件日志');

      const filtersLogs = (window as any).getFiltersLogs?.() || [];
      console.log(`✅ Filters日志: ${filtersLogs.length} 条`);

      const tableFilterLogs = (window as any).getTableFilterLogs?.() || [];
      console.log(`✅ TableFilterPlugin日志: ${tableFilterLogs.length} 条`);

      // 🔍 按时间排序所有日志
      const allLogsArray = [
        ...filtersLogs.map((log: any) => ({ ...log, source: 'Filters' })),
        ...tableFilterLogs.map((log: any) => ({
          ...log,
          source: 'TableFilterPlugin',
        })),
      ].sort((a, b) => a.timestamp - b.timestamp);

      const allLogs = {
        metadata: {
          exportTime: new Date().toISOString(),
          components: {
            Filters: filtersLogs.length,
            TableFilterPlugin: tableFilterLogs.length,
          },
          total: filtersLogs.length + tableFilterLogs.length,
          timeline: {
            firstLog: allLogsArray[0]?.timestamp
              ? new Date(allLogsArray[0].timestamp).toISOString()
              : null,
            lastLog: allLogsArray[allLogsArray.length - 1]?.timestamp
              ? new Date(
                  allLogsArray[allLogsArray.length - 1].timestamp,
                ).toISOString()
              : null,
          },
        },
        logs: {
          filters: filtersLogs,
          tableFilter: tableFilterLogs,
          timeline: allLogsArray, // 按时间排序的所有日志
        },
      };

      console.groupEnd();

      // 导出到文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `route-filter-debug-logs-${timestamp}.json`;
      const blob = new Blob([JSON.stringify(allLogs, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ 路由筛选项调试日志已导出: ${filename}`);
      console.table(allLogs.metadata);

      return allLogs;
    };

    console.log('✅ exportAllComponentLogs 函数已注册到 window 对象');
  }
}

export default filterLogger;
