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

import type React from 'react';
import { useEffect, useState } from 'react';
import type { SelectBlockPluginManager } from '../core/plugin-manager';
import { logger } from '../logger';
import type { SelectOption } from '../types/interface';
import type { SelectBlockState } from '../types/plugin';

/**
 * 状态订阅Hook
 * 管理与PluginManager的状态同步，规避React批量渲染时序问题
 */
export function useStateSubscription(
  pluginManagerRef: React.MutableRefObject<
    SelectBlockPluginManager | undefined
  >,
  initialOptions: SelectOption[],
  hookTraceId: string,
) {
  // 🔧 使用实时订阅机制获取最新状态，规避React批量渲染问题
  const [currentState, setCurrentState] = useState<SelectBlockState>(() => ({
    fetchOptions: initialOptions || [],
    initFetchOptions: initialOptions || [],
    fetching: false,
    loading: false,
    skip: 0,
    searchValue: '',
    canTriggerLoadMore: true,
    mounted: false,
  }));

  // 🔧 订阅PluginManager状态变化，实时同步
  useEffect(() => {
    if (!pluginManagerRef.current) {
      return () => {};
    }

    // 立即获取当前状态
    setCurrentState(pluginManagerRef.current.getState());

    // 订阅后续状态变化
    const unsubscribe = pluginManagerRef.current.subscribe((newState) => {
      logger.debug(
        'UseStateSubscription',
        '收到状态订阅通知',
        {
          newLoading: newState.loading,
          newFetching: newState.fetching,
          optionsLength: newState.fetchOptions?.length || 0,
        },
        'useStateSubscription',
        hookTraceId,
      );
      setCurrentState(newState);
    });

    // 清理订阅
    return unsubscribe;
  }, [hookTraceId]);

  return {
    currentState,
  };
}
