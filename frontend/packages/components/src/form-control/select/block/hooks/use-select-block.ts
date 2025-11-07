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

import { logger } from '../logger';
import type { veArchSelectBlockProps } from '../types/interface';

// 导入子Hook
import { useBaseConfig } from './use-base-config';
import { useDebugEffects } from './use-debug-effects';
import { useDebugLogging } from './use-debug-logging';
import { useDefaultValueEffects } from './use-default-value-effects';
import { useEventHandlers } from './use-event-handlers';
import { useFetchEffects } from './use-fetch-effects';
import { useOptionsProcessing } from './use-options-processing';
import { usePluginManager } from './use-plugin-manager';
import { useReturnValue } from './use-return-value';
import { useStateSubscription } from './use-state-subscription';

/**
 * SelectBlock主Hook，整合所有插件功能
 * 高度模块化版本：每个功能模块都被拆分为专门的子Hook，提高可维护性和可读性
 */
export function useSelectBlock(props: veArchSelectBlockProps) {
  // === 1. 基础配置处理 ===
  const {
    hookTraceId,
    initialOptions,
    limit,
    renderCountRef,
    isDebouncedFetch,
    defaultActiveFirstOption,
    value,
    onChange,
    dataSource,
    dataSourceShare,
    isFirstHint,
    dependency,
  } = useBaseConfig(props);

  // 从 props 中获取 remoteSearchKey
  const { remoteSearchKey } = props;

  // === 2. 调试日志系统 ===
  const { debugLogs, consoleDebugLogs, addDebugLog } =
    useDebugLogging(hookTraceId);

  // === 3. 插件管理器 ===
  const {
    pluginManagerRef,
    dataFetcher,
    searchHandler,
    paginationHandler,
    pasteHandler,
  } = usePluginManager(props, initialOptions, limit, addDebugLog, hookTraceId);

  // === 4. 状态订阅 ===
  const { currentState } = useStateSubscription(
    pluginManagerRef,
    initialOptions,
    hookTraceId,
  );

  // === 5. 选项处理 ===
  const {
    finalOptions,
    finalDefaultValue,
    finalValue,
    shouldFetchOptionsWithDefaultValue,
    shouldFetchDueToValueEmpty,
    _canFetch,
  } = useOptionsProcessing(props, currentState, dataFetcher);

  // === 6. 事件处理器 ===
  addDebugLog('BEFORE_EVENT_HANDLERS', {
    _canFetch,
    _canFetchType: typeof _canFetch,
    shouldFetchOptionsWithDefaultValue,
    dataSource: dataSource ? 'exists' : 'missing',
  });

  const {
    onSearch,
    handlePaste,
    handleVisibleChange,
    handleClear,
    popupScrollHandler,
    _fetchOptions,
  } = useEventHandlers(
    props,
    currentState,
    searchHandler,
    pasteHandler,
    paginationHandler,
    dataFetcher,
    _canFetch,
    shouldFetchOptionsWithDefaultValue,
    addDebugLog,
    pluginManagerRef,
  );

  addDebugLog('AFTER_EVENT_HANDLERS', {
    _canFetch,
    _canFetchType: typeof _canFetch,
  });

  // === 7. 调试副作用处理 ===
  useDebugEffects({
    currentState,
    renderCountRef,
    props,
    value,
    debugLogs,
    consoleDebugLogs,
    addDebugLog,
  });

  // === 8. 数据获取副作用处理 ===
  useFetchEffects({
    shouldFetchOptionsWithDefaultValue,
    shouldFetchDueToValueEmpty,
    _fetchOptions,
    _canFetch,
    currentState,
    dataSource,
    dataSourceShare,
    isFirstHint,
    dependency,
    value,
    dataFetcher,
    searchHandler,
    initialOptions,
    pluginManagerRef,
    addDebugLog,
    remoteSearchKey,
  });

  // === 9. 默认值副作用处理 ===
  // 🔧 全链路追踪标记点 3：调用 useDefaultValueEffects 前
  logger.info(
    'UseSelectBlock',
    '🟡 [全链路-3] 准备调用 useDefaultValueEffects',
    {
      defaultActiveFirstOption,
      finalDefaultValue,
      value,
      mode: props.mode,
      hasOnChange: Boolean(onChange),
      willPass: {
        defaultActiveFirstOption,
        finalDefaultValue,
        value,
        mode: props.mode,
      },
    },
    'useSelectBlock',
  );

  useDefaultValueEffects({
    defaultActiveFirstOption,
    finalDefaultValue,
    onChange: onChange as
      | ((value: unknown, option?: unknown) => void)
      | undefined,
    value, // 🔧 传入当前value，防止覆盖已选择的值
    mode: props.mode, // 🔧 传入mode，用于判断多选模式下的空值
  });

  // === 10. 返回最终结果 ===
  return useReturnValue({
    currentState,
    finalOptions,
    finalDefaultValue,
    finalValue,
    onSearch,
    handlePaste,
    handleVisibleChange,
    handleClear,
    popupScrollHandler,
    isDebouncedFetch,
  });
}
