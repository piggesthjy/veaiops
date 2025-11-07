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

import { useCallback, useRef } from 'react';
import { logger } from '../logger';

/**
 * 调试日志系统Hook
 * 提供统一的调试日志收集和管理功能
 */
export function useDebugLogging(hookTraceId: string) {
  const debugLogsRef = useRef<any[]>([]);
  const consoleDebugLogsRef = useRef<any[]>([]);

  const addDebugLog = useCallback(
    (action: string, data: any) => {
      const logEntry = {
        action,
        data,
        timestamp: Date.now(),
        hookTraceId,
      };

      debugLogsRef.current.push(logEntry);
      consoleDebugLogsRef.current.push(logEntry);

      logger.debug(
        'UseSelectBlock',
        `调试日志: ${action}`,
        { logEntry },
        'addDebugLog',
        hookTraceId,
      );
    },
    [hookTraceId], // 只依赖hookTraceId，避免因为数组变化导致函数重新创建
  );

  return {
    debugLogs: debugLogsRef.current,
    consoleDebugLogs: consoleDebugLogsRef.current,
    addDebugLog,
  };
}
