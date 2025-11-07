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
import type { LocalStorageAnalysis } from './types';

/**
 * 备份 localStorage 状态
 */
export function backupLocalStorage(): Record<string, string> {
  const backup: Record<string, string> = {};

  try {
    // 备份全局引导相关的 localStorage 项
    const keys = [
      'global-guide-store',
      've_arch_amap_logs_session_',
      'guide_tracking',
    ];

    keys.forEach((key) => {
      if (key.includes('session_')) {
        // 处理 session 相关的 key
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey?.includes(key)) {
            backup[storageKey] = localStorage.getItem(storageKey) || '';
          }
        }
      } else {
        const value = localStorage.getItem(key);
        if (value) {
          backup[key] = value;
        }
      }
    });

    logger.info({
      message: 'localStorage 备份完成',
      data: {
        backupKeys: Object.keys(backup),
        backupSize: JSON.stringify(backup).length,
      },
      source: 'GlobalGuideAnalyzer',
    });
  } catch (error) {
    // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({
      message: 'localStorage 备份失败',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
      },
      source: 'GlobalGuideAnalyzer',
      component: 'backupLocalStorage',
    });
  }

  return backup;
}

/**
 * 分析 localStorage
 */
export function analyzeLocalStorage(
  localStorageBackup: Record<string, string>,
): LocalStorageAnalysis {
  const analysis: LocalStorageAnalysis = {
    globalGuideStore: null,
    issues: [],
  };

  try {
    const guideStore =
      localStorageBackup['global-guide-store'] ||
      localStorage.getItem('global-guide-store');

    if (guideStore) {
      const parsed = JSON.parse(guideStore);
      analysis.globalGuideStore = parsed;

      // 检查关键问题
      if ('state' in parsed && 'guideVisible' in parsed.state) {
        analysis.issues.push({
          type: 'persistence_issue',
          message: 'guideVisible 仍然被持久化',
          severity: 'high',
          value: parsed.state.guideVisible,
        });
      }

      if (parsed.state?.guideVisible === true) {
        analysis.issues.push({
          type: 'initial_state_issue',
          message: 'guideVisible 初始值为 true',
          severity: 'high',
          value: parsed.state.guideVisible,
        });
      }
    } else {
      analysis.issues.push({
        type: 'missing_store',
        message: 'global-guide-store 不存在',
        severity: 'info',
      });
    }
  } catch (error) {
    // ✅ 正确：透出实际错误信息
    const errorObj = error instanceof Error ? error : new Error(String(error));
    analysis.issues.push({
      type: 'parse_error',
      message: '解析 global-guide-store 失败',
      severity: 'error',
      error: errorObj.message,
    });
  }

  return analysis;
}
