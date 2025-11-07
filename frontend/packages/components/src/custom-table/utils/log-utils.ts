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
 * 日志工具函数
 * 提供一致的日志格式化和序列化功能，集成性能监控
 *
 * 🔥 增强版：集成 @veaiops/utils logger 和 log-exporter
 */

import { logger } from '@veaiops/utils';
import React from 'react';
// import { useAutoLogExport } from '@veaiops/utils';
import { performanceLogger } from './performance-logger';

/**
 * serializeLog 参数接口
 */
export interface SerializeLogParams {
  data: unknown;
  space?: number;
}

/**
 * 序列化对象为JSON字符串，方便复制调试
 * @param params 序列化参数
 * @returns 格式化的JSON字符串
 */
export function serializeLog({ data, space = 2 }: SerializeLogParams): string {
  try {
    return JSON.stringify(
      data,
      (key, value) => {
        // 处理循环引用和特殊对象
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }

        // 处理函数
        if (typeof value === 'function') {
          return `[Function: ${value.name || 'anonymous'}]`;
        }

        // 处理undefined
        if (value === undefined) {
          return '[undefined]';
        }

        return value;
      },
      space,
    );
  } catch (error) {
    // 如果序列化失败，返回字符串表示（静默处理，不记录日志）
    return String(data);
  }
}

/**
 * CustomTable 专用日志工具（优化版）
 *
 * ✅ 优化：统一使用 @veaiops/utils logger
 * - 统一导入 logger（移除重复的别名导入）
 * - 移除重复的 console 输出（logger 内部已处理）
 * - 移除重复的时间戳格式化（logger 内部已处理）
 * - 保留性能监控专用功能
 *
 * @example
 * ```typescript
 * devLog.error({ component: 'PluginExecutor', message: '插件执行失败', data: { pluginName: 'test' } });
 * devLog.warn({ component: 'LifecycleManager', message: '生命周期警告', data: { phase: 'onMount' } });
 * ```
 */
/**
 * devLog 方法参数接口
 */
interface DevLogParams {
  component: string;
  message: string;
  data?: unknown;
}

interface DevLogRenderParams {
  component: string;
  data?: unknown;
}

export const devLog = {
  log: ({ component, message, data }: DevLogParams) => {
    const logData = data ? { data } : undefined;
    // ✅ 统一使用 logger（logger 内部已处理 console 输出和时间戳格式化）
    logger.log({
      message,
      data: logData,
      source: 'CustomTable',
      component,
    });
    // 性能监控（专用功能，保留）
    performanceLogger.log({
      level: 'debug',
      component,
      message,
      data: logData,
    });
  },

  warn: ({ component, message, data }: DevLogParams) => {
    const logData = data ? { data } : undefined;
    logger.warn({
      message,
      data: logData,
      source: 'CustomTable',
      component,
    });
    performanceLogger.log({ level: 'warn', component, message, data: logData });
  },

  error: ({ component, message, data }: DevLogParams) => {
    const logData = data ? { data } : undefined;
    logger.error({
      message,
      data: logData,
      source: 'CustomTable',
      component,
    });
    performanceLogger.log({
      level: 'error',
      component,
      message,
      data: logData,
    });
  },

  info: ({ component, message, data }: DevLogParams) => {
    const logData = data ? { data } : undefined;
    logger.info({
      message,
      data: logData,
      source: 'CustomTable',
      component,
    });
    performanceLogger.log({ level: 'info', component, message, data: logData });
  },

  // 渲染日志专用方法
  render: ({ component, data }: DevLogRenderParams) => {
    performanceLogger.logRender({ component });
    if (data) {
      logger.debug({
        message: '渲染数据',
        data: { renderData: data },
        source: 'CustomTable',
        component,
      });
      performanceLogger.log({
        level: 'debug',
        component,
        message: '渲染数据',
        data: { renderData: data },
      });
    }
  },

  // 性能日志专用方法
  performance: ({
    component,
    operation,
    duration,
    data,
  }: {
    component: string;
    operation: string;
    duration: number;
    data?: unknown;
  }) => {
    const logData = { duration, operation, data };
    logger.info({
      message: `性能监控: ${operation}`,
      data: logData,
      source: 'CustomTable',
      component,
    });
    performanceLogger.log({
      level: 'info',
      component,
      message: `性能监控: ${operation}`,
      data: logData,
    });
  },

  // 生命周期日志专用方法
  lifecycle: ({
    component,
    event,
    data,
  }: {
    component: string;
    event: string;
    data?: unknown;
  }) => {
    logger.info({
      message: `生命周期: ${event}`,
      data: { event, data },
      source: 'CustomTable',
      component,
    });
    performanceLogger.log({
      level: 'info',
      component,
      message: `生命周期: ${event}`,
      data: { event, data },
    });
  },
};

// 🚀 新增：CustomTable 自动日志导出 Hook
/**
 * CustomTable 自动日志导出 Hook（占位符实现）
 *
 * 注意：log-exporter 功能尚未集成，这是一个占位符实现
 * 返回空的实现，不会执行任何操作，也不会打印警告
 *
 * @param options - 导出选项（当前未使用）
 * @returns 导出控制对象
 */
export const useCustomTableAutoLogExport = (options?: {
  autoStart?: boolean;
  exportOnUnload?: boolean;
  filename?: string;
}) => {
  // ✅ 静默处理：这是一个已知的占位符实现，不打印警告
  // 当 log-exporter 功能集成后，可以替换为实际的实现
  // 使用 useMemo 确保返回值的引用稳定，避免不必要的重新渲染
  return React.useMemo(
    () => ({
      isExporting: false,
      exportLogs: () => Promise.resolve(),
      clearLogs: () => {
        // 清除日志 - 此实现为空，具体逻辑由调用方处理
      },
    }),
    [],
  );
};

// 🚀 新增：全局日志导出接口，供 log-exporter 使用
if (typeof window !== 'undefined') {
  // 暴露 CustomTable 日志获取接口给统一日志导出系统
  (window as any).getCustomTableLogs = () => {
    try {
      // 获取 performance logger 的日志
      const perfLogs = performanceLogger.generateReport().logs;

      // 获取 @veaiops/utils logger 的日志（过滤出 CustomTable 相关的）
      const utilsLogs = logger
        .getLogs()
        .filter(
          (log) =>
            log.source === 'CustomTable' ||
            log.component?.startsWith('CustomTable'),
        );

      // 合并并去重
      const allLogs = [...perfLogs, ...utilsLogs];
      const uniqueLogs = allLogs.filter(
        (log, index, self) =>
          index ===
          self.findIndex(
            (l) => l.timestamp === log.timestamp && l.message === log.message,
          ),
      );

      // 按时间排序
      uniqueLogs.sort((a, b) => a.timestamp - b.timestamp);

      return uniqueLogs;
    } catch (error: unknown) {
      // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: '获取 CustomTable 日志失败',
        data: { error: errorObj.message, stack: errorObj.stack },
        source: 'CustomTable',
        component: 'getCustomTableLogs',
      });
      return [];
    }
  };
}
