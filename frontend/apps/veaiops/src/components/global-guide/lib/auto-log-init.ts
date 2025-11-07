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
 * 自动日志收集初始化
 * 在应用启动时自动开始收集新建连接功能的调试日志
 */

import { logger } from '@veaiops/utils';

import { initAutoLogCollection } from './debug-collector';

/**
 * 初始化自动日志收集
 * 这个函数会在模块加载时自动执行
 */
const initializeAutoLogCollection = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    logger.info({
      message: '[AutoLogInit] 开始初始化自动日志收集',
      data: {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      source: 'AutoLogInit',
      component: 'initialize',
    });

    // 启动自动日志收集
    const cleanup = initAutoLogCollection();

    // 将清理函数存储到全局对象，方便手动停止
    if (typeof window !== 'undefined') {
      (window as any).__autoLogCleanup = cleanup;
    }

    logger.info({
      message: '[AutoLogInit] 自动日志收集初始化完成',
      data: {
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      source: 'AutoLogInit',
      component: 'initialized',
    });
  } catch (error) {
    logger.error({
      message: '[AutoLogInit] 自动日志收集初始化失败',
      data: {
        error: error instanceof Error ? error.message : String(error),
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      source: 'AutoLogInit',
      component: 'initFailed',
    });
  }
};

// 立即执行初始化
initializeAutoLogCollection();

// 导出初始化函数，供其他地方手动调用
export { initializeAutoLogCollection };
