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

import { logger as utilLogger } from '@veaiops/utils';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { logger } from '../logger';
import type { DataFetcherPluginImpl } from '../plugins/data-fetcher';
import type { SearchHandlerPluginImpl } from '../plugins/search-handler';
import type { SelectBlockState } from '../types/plugin';

/**
 * 数据获取副作用Hook
 * 负责处理自动获取选项、主要数据获取等副作用逻辑
 */
export function useFetchEffects(props: {
  shouldFetchOptionsWithDefaultValue: boolean;
  shouldFetchDueToValueEmpty: boolean;
  _fetchOptions: () => void;
  _canFetch: boolean;
  currentState: SelectBlockState;
  dataSource: unknown;
  dataSourceShare: boolean;
  isFirstHint: boolean;
  dependency: unknown;
  value: unknown;
  dataFetcher: DataFetcherPluginImpl | undefined;
  searchHandler: SearchHandlerPluginImpl | undefined;
  initialOptions: unknown;
  pluginManagerRef: React.MutableRefObject<any>;
  addDebugLog: (action: string, data: Record<string, unknown>) => void;
  remoteSearchKey?: string;
}) {
  const {
    shouldFetchDueToValueEmpty,
    _fetchOptions,
    _canFetch,
    currentState,
    dataSource,
    dataSourceShare,
    isFirstHint,
    dependency,
    initialOptions,
    pluginManagerRef,
    addDebugLog,
    dataFetcher,
    searchHandler,
    value,
    remoteSearchKey,
  } = props;

  // 🔧 创建组件实例唯一ID（只在第一次渲染时创建）
  const instanceIdRef = useRef(
    `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );

  // 🔧 调试：确认Hook被调用
  utilLogger.info({
    message: '🎯 Hook被调用',
    data: {
      instanceId: instanceIdRef.current,
      dependency,
      hasDataSource: Boolean(dataSource),
      dataSourceType: typeof dataSource,
      _canFetch,
    },
    source: 'SelectBlock',
    component: 'UseFetchEffects',
  });

  // 🔧 使用 ref 存储最新的 searchValue，避免循环依赖
  const searchValueRef = useRef(currentState?.searchValue);
  useEffect(() => {
    searchValueRef.current = currentState?.searchValue;
  }, [currentState?.searchValue]);

  // 🔧 使用 ref 标记 dependency 是否正在处理，避免重复请求
  const isDependencyFetchingRef = useRef(false);

  // 🔧 使用 ref 存储上一次的 dependency，用于基础数据获取判断
  // 💡 初始化为空字符串，这样首次有效dependency时会被识别为"变化"
  const prevDependencyForBasicFetchRef = useRef<string>('');

  // === 1. 基础数据获取条件检查 ===
  useEffect(() => {
    const currentDependencyStr = JSON.stringify(dependency);
    const dependencyChangedForBasic =
      prevDependencyForBasicFetchRef.current !== currentDependencyStr;

    // 🔧 检查dependency是否有效 - 简化判断
    const hasValidDependency = Boolean(
      currentDependencyStr &&
        currentDependencyStr !== 'null' &&
        currentDependencyStr !== 'undefined',
    );
    const prevDependencyValid = Boolean(
      prevDependencyForBasicFetchRef.current &&
        prevDependencyForBasicFetchRef.current !== 'null' &&
        prevDependencyForBasicFetchRef.current !== 'undefined',
    );

    const shouldFetchBasic = Boolean(
      currentState && !currentState.searchValue && _canFetch && dataSource,
    );

    // 🔧 详细记录条件检查
    const conditionsDetail = {
      hasCurrentState: Boolean(currentState),
      searchValueEmpty: !currentState?.searchValue,
      searchValue: currentState?.searchValue,
      canFetch: _canFetch,
      hasDataSource: Boolean(dataSource),
      dataSourceType: typeof dataSource,
      dataSourceIsObject: typeof dataSource === 'object' && dataSource !== null,
      dataSourceKeys:
        typeof dataSource === 'object' && dataSource !== null
          ? Object.keys(dataSource)
          : [],
      dataSourceApi:
        typeof dataSource === 'object' &&
        dataSource !== null &&
        'api' in dataSource
          ? (dataSource as any).api
          : undefined,
      shouldFetchDueToValueEmpty,
      shouldFetchBasic,
      dataSourceShare,
      // 🔧 新增：dependency 相关检查
      dependencyChangedForBasic,
      currentDependency: currentDependencyStr,
      prevDependency: prevDependencyForBasicFetchRef.current,
      hasValidDependency,
      prevDependencyValid,
      // 🔧 新增：当前是否有数据
      hasFetchOptions: Boolean(currentState?.fetchOptions?.length),
      fetchOptionsCount: currentState?.fetchOptions?.length || 0,
      mounted: currentState?.mounted,
    };

    utilLogger.info({
      message: '📋 基础数据获取条件检查',
      data: {
        hasCurrentState: Boolean(currentState),
        canFetch: _canFetch,
        hasDataSource: Boolean(dataSource),
        hasFetchOptions: Boolean(currentState?.fetchOptions?.length),
        dependencyChangedForBasic,
      },
      source: 'SelectBlock',
      component: 'UseFetchEffects',
    });
    logger.info(
      'UseFetchEffects',
      '基础数据获取条件检查',
      conditionsDetail,
      'useEffect_basicFetch',
    );

    // 🔧 如果 dependency 从无效变为有效，或从有效变为其他有效值，跳过基础数据获取（由 dependency useEffect 处理）
    const isDependencyTransition =
      dependencyChangedForBasic && (hasValidDependency || prevDependencyValid);

    if (isDependencyTransition) {
      utilLogger.warn({
        message: '⏸️ 跳过基础数据获取 - dependency 有效变化',
        data: {
          currentDependency: currentDependencyStr,
          prevDependency: prevDependencyForBasicFetchRef.current,
        },
        source: 'SelectBlock',
        component: 'UseFetchEffects',
      });
      logger.warn(
        'UseFetchEffects',
        '⏸️ 跳过基础数据获取 - dependency 有效变化',
        {
          currentDependency: currentDependencyStr,
          prevDependency: prevDependencyForBasicFetchRef.current,
          hasValidDependency,
          prevDependencyValid,
        },
        'useEffect_basicFetch',
      );
      prevDependencyForBasicFetchRef.current = currentDependencyStr;
      return;
    }

    // 🔧 更新ref（对于无效dependency的变化也要记录，避免重复判断）
    if (dependencyChangedForBasic) {
      prevDependencyForBasicFetchRef.current = currentDependencyStr;
    }

    // 🔧 如果 dependency 正在处理，跳过基础数据获取，避免重复请求
    if (isDependencyFetchingRef.current) {
      logger.warn(
        'UseFetchEffects',
        '⏸️ 跳过基础数据获取 - dependency 正在处理',
        {
          isDependencyFetching: true,
        },
        'useEffect_basicFetch',
      );
      return;
    }

    if (!shouldFetchBasic && !shouldFetchDueToValueEmpty) {
      addDebugLog('SKIPPING_BASIC_FETCH', {
        reason: 'conditions not met',
        conditions: conditionsDetail,
      });
      logger.warn(
        'UseFetchEffects',
        '跳过数据获取 - 条件不满足',
        conditionsDetail,
        'useEffect_basicFetch',
      );
      return;
    }

    // 🔧 修复：如果已经有数据且已挂载，不需要重复获取
    if (
      currentState?.fetchOptions?.length > 0 &&
      currentState?.mounted &&
      !shouldFetchDueToValueEmpty
    ) {
      logger.info(
        'UseFetchEffects',
        '跳过数据获取 - 已有数据',
        {
          fetchOptionsCount: currentState.fetchOptions.length,
          mounted: currentState.mounted,
        },
        'useEffect_basicFetch',
      );
      return;
    }

    logger.info(
      'UseFetchEffects',
      '准备发起请求',
      {
        dataSourceShare,
        willFetch: !dataSourceShare,
        hasFetchOptions: Boolean(_fetchOptions),
      },
      'useEffect_basicFetch',
    );

    // 正常数据获取逻辑
    if (!dataSourceShare) {
      _fetchOptions();
    }
  }, [
    currentState?.searchValue,
    _canFetch,
    dataSource,
    dataSourceShare,
    shouldFetchDueToValueEmpty,
    dependency,
  ]); // 注意：依赖 currentState?.searchValue 而不是整个 currentState 对象

  // === 2. 数据源共享处理 ===
  useEffect(() => {
    if (!dataSourceShare) {
      return;
    }

    const shouldFetch = Boolean(
      (currentState && !currentState.searchValue && _canFetch && dataSource) ||
        shouldFetchDueToValueEmpty,
    );

    if (!shouldFetch) {
      return;
    }

    if (isFirstHint) {
      addDebugLog('TRIGGERING_FETCH_IMMEDIATE', {
        reason: 'dataSourceShare + isFirstHint',
      });
      _fetchOptions();
    } else {
      addDebugLog('TRIGGERING_FETCH_DELAYED', {
        reason: 'dataSourceShare + !isFirstHint',
      });
      setTimeout(() => {
        _fetchOptions();
      }, 1000);
    }
  }, [
    dataSourceShare,
    isFirstHint,
    currentState?.searchValue, // 注意：只依赖 searchValue 属性，不是整个对象
    _canFetch,
    dataSource,
    shouldFetchDueToValueEmpty,
  ]);

  // === 3. 初始选项处理 ===
  useEffect(() => {
    const hasInitialOptions = Boolean(
      initialOptions &&
        Array.isArray(initialOptions) &&
        initialOptions.length > 0,
    );

    const shouldHandleInitialOptions = Boolean(
      !currentState?.searchValue && !dataSource && hasInitialOptions,
    );

    if (!shouldHandleInitialOptions) {
      return;
    }

    addDebugLog('TRIGGERING_RERENDER_FOR_INITIAL_OPTIONS', {
      reason: 'dependency change with initialOptions but no dataSource',
    });

    // 触发状态版本更新，强制重新渲染
    pluginManagerRef.current?.setState({
      stateVersion:
        (pluginManagerRef.current?.getState()?.stateVersion || 0) + 1,
    });
  }, [currentState?.searchValue, dataSource, initialOptions, dependency]); // 注意：只依赖 searchValue 属性，不是整个对象

  // === 4. dependency 变化监控 ===
  // 🔧 使用 ref 存储上一次的 dependency 字符串，便于追踪变化
  // 💡 初始化为空字符串，这样首次有效dependency时会被识别为"变化"
  const prevDependencyStrRef = useRef<string>('');

  useEffect(() => {
    // 🔧 立即输出日志，确认useEffect被执行
    utilLogger.info({
      message: '⚡ dependency useEffect开始执行',
      data: {
        instanceId: instanceIdRef.current,
        dependency,
        dataSource: Boolean(dataSource),
        prevDependency: prevDependencyStrRef.current,
      },
      source: 'SelectBlock',
      component: 'UseFetchEffects',
    });

    const prevDependencyStr = prevDependencyStrRef.current;
    const currentDependencyStr = JSON.stringify(dependency) || ''; // 处理undefined返回undefined的情况
    const dependencyChanged = prevDependencyStr !== currentDependencyStr;

    // 🔧 判断dependency是否有效
    // 注意：JSON.stringify(undefined)返回undefined（不是字符串），需要特殊处理
    const hasValidDependency = Boolean(
      currentDependencyStr &&
        currentDependencyStr !== '' &&
        currentDependencyStr !== 'null' &&
        currentDependencyStr !== 'undefined',
    );
    const hasDataSource = Boolean(dataSource);

    // 🔧 使用utilLogger输出详细信息
    utilLogger.info({
      message: '🟣 dependency useEffect 触发',
      data: {
        instanceId: instanceIdRef.current,
        // 🎯 dependency 对比
        dependency: currentDependencyStr,
        dependencyRaw: dependency,
        dependencyType: typeof dependency,
        dependencyIsArray: Array.isArray(dependency),
        dependencyFirstItem: Array.isArray(dependency)
          ? dependency[0]
          : undefined,
        prevDependency: prevDependencyStr,
        dependencyChanged,
        hasValidDependency,
        // dataSource 信息
        hasDataSource,
        dataSourceType: typeof dataSource,
        dataSourceApi:
          typeof dataSource === 'object' &&
          dataSource !== null &&
          'api' in dataSource
            ? (dataSource as any).api
            : undefined,
        // 其他条件
        _canFetch,
        currentSearchValue: currentState?.searchValue,
        hasFetchOptions: Boolean(currentState?.fetchOptions?.length),
        willTriggerFetch: _canFetch && hasDataSource && dependencyChanged,
      },
      source: 'SelectBlock',
      component: 'UseFetchEffects',
    });

    // 保留原logger用于内部日志系统
    logger.info(
      'UseFetchEffects',
      '🟣 dependency useEffect 触发',
      {
        dependencyChanged,
        hasValidDependency,
        willTriggerFetch: _canFetch && hasDataSource && dependencyChanged,
      },
      'useEffect_dependency',
    );

    // 🔧 只有 dependency 真正变化时才触发
    if (!dependencyChanged) {
      utilLogger.debug({
        message: 'dependency 未变化，跳过',
        data: {
          dependency: currentDependencyStr,
          prevDependency: prevDependencyStr,
        },
        source: 'SelectBlock',
        component: 'UseFetchEffects',
      });
      logger.debug(
        'UseFetchEffects',
        'dependency 未变化，跳过',
        {
          dependency: currentDependencyStr,
          prevDependency: prevDependencyStr,
          bothAreEqual: prevDependencyStr === currentDependencyStr,
        },
        'useEffect_dependency',
      );
      return;
    }

    // 🔧 如果当前dependency无效，只更新ref不触发获取
    if (!hasValidDependency) {
      prevDependencyStrRef.current = currentDependencyStr;
      utilLogger.debug({
        message: 'dependency 无效，仅更新ref',
        data: {
          dependency: currentDependencyStr,
        },
        source: 'SelectBlock',
        component: 'UseFetchEffects',
      });
      logger.debug(
        'UseFetchEffects',
        'dependency 无效，仅更新ref',
        {
          dependency: currentDependencyStr,
          hasValidDependency,
        },
        'useEffect_dependency',
      );
      return;
    }

    // 更新 ref（在检查之后更新）
    prevDependencyStrRef.current = currentDependencyStr;

    // 🔧 修复：dependency 变化时，清除旧的防抖函数，强制重新创建
    // 这样新的防抖函数会使用最新的 dataSource
    // 🔧 边界情况：检查 searchHandler 是否存在且有 clearDebouncedSearch 方法
    if (searchHandler && 'clearDebouncedSearch' in searchHandler) {
      // 清除旧的防抖函数，强制重新创建
      (searchHandler as any).clearDebouncedSearch();
      const currentDataSourceApi =
        typeof dataSource === 'object' &&
        dataSource !== null &&
        'api' in dataSource
          ? (dataSource as any).api
          : undefined;

      logger.info(
        'UseFetchEffects',
        '✅ dependency 变化 - 已清除旧的防抖函数',
        {
          dependency: JSON.stringify(dependency),
          dataSourceApi: currentDataSourceApi,
        },
        'useEffect_dependency',
      );
      utilLogger.info({
        message: '✅ dependency 变化 - 已清除旧的防抖函数',
        data: {
          dependency: JSON.stringify(dependency),
          dataSourceApi: currentDataSourceApi,
        },
        source: 'SelectBlock',
        component: 'UseFetchEffects',
      });
    } else {
      // 🔧 边界情况：记录为什么没有清除防抖函数
      const reason = !searchHandler
        ? 'searchHandler 不存在'
        : 'searchHandler 无 clearDebouncedSearch 方法';
      utilLogger.warn({
        message: '⚠️ dependency 变化 - 无法清除防抖函数',
        data: {
          reason,
          hasSearchHandler: Boolean(searchHandler),
          dependency: JSON.stringify(dependency),
        },
        source: 'SelectBlock',
        component: 'UseFetchEffects',
      });
    }

    // 当 dependency 变化时，如果满足条件，应该重新获取数据
    // 🔧 修复：即使已有数据，dependency 变化时也应该重新获取
    // 🔧 边界情况：检查 _canFetch 和 dataSource 是否有效
    if (!_canFetch || !dataSource) {
      utilLogger.warn({
        message: '⚠️ dependency 变化 - 无法触发数据获取',
        data: {
          reason: !_canFetch ? 'canFetch 为 false' : 'dataSource 不存在',
          _canFetch,
          hasDataSource: Boolean(dataSource),
          dependency: JSON.stringify(dependency),
        },
        source: 'SelectBlock',
        component: 'UseFetchEffects',
      });
      // 🔧 清除标记
      isDependencyFetchingRef.current = false;
      return;
    }

    utilLogger.info({
      message: '✅ dependency 变化 - 触发数据获取',
      data: {
        dependency: JSON.stringify(dependency),
        hasDataFetcher: Boolean(dataFetcher),
        hasSearchHandler: Boolean(searchHandler),
      },
      source: 'SelectBlock',
      component: 'UseFetchEffects',
    });
    logger.info(
      'UseFetchEffects',
      'dependency 变化 - 触发数据获取',
      {
        dependency: JSON.stringify(dependency),
        hasDataFetcher: Boolean(dataFetcher),
        hasSearchHandler: Boolean(searchHandler),
        currentSearchValue: currentState?.searchValue,
      },
      'useEffect_dependency',
    );

    // 🔧 设置标记，防止基础数据获取 useEffect 重复请求
    isDependencyFetchingRef.current = true;

    // 🔧 修复：dependency 变化时立即获取数据，不使用防抖
    // 🔧 边界情况：检查所有必需的插件和状态
    if (!dataFetcher || !searchHandler || !currentState) {
      utilLogger.warn({
        message: '⚠️ dependency 变化 - 缺少必要的插件或状态',
        data: {
          hasDataFetcher: Boolean(dataFetcher),
          hasSearchHandler: Boolean(searchHandler),
          hasCurrentState: Boolean(currentState),
        },
        source: 'SelectBlock',
        component: 'UseFetchEffects',
      });
      // 🔧 清除标记
      isDependencyFetchingRef.current = false;
      return;
    }

    logger.info(
      'UseFetchEffects',
      'dependency 变化 - 立即获取数据（不防抖）',
      {
        hasDataFetcher: Boolean(dataFetcher),
        hasSearchHandler: Boolean(searchHandler),
        remoteSearchKey,
        value,
      },
      'useEffect_dependency',
    );

    // 直接调用 dataFetcher，不经过防抖
    (async () => {
      try {
        // 🔧 边界情况：获取 context，优先使用 searchHandler 的 context
        const ctx =
          (searchHandler as any).context || (dataFetcher as any).context;
        if (!ctx) {
          utilLogger.warn({
            message: '⚠️ dependency 变化 - context 不可用',
            data: {
              hasSearchHandlerContext: Boolean((searchHandler as any).context),
              hasDataFetcherContext: Boolean((dataFetcher as any).context),
            },
            source: 'SelectBlock',
            component: 'UseFetchEffects',
          });
          logger.warn(
            'UseFetchEffects',
            'dependency 变化 - context 不可用',
            {},
            'useEffect_dependency',
          );
          isDependencyFetchingRef.current = false; // 🔧 清除标记
          return;
        }

        logger.info(
          'UseFetchEffects',
          'dependency 变化 - 开始请求数据',
          {
            hasContext: Boolean(ctx),
          },
          'useEffect_dependency',
        );

        // 🔧 重要：先清空旧的 options，避免显示错误数据
        ctx.setState({
          fetchOptions: [],
          initFetchOptions: [],
          loading: true,
          fetching: true,
        });

        logger.info(
          'UseFetchEffects',
          'dependency 变化 - 已清空旧 options',
          {},
          'useEffect_dependency',
        );

        // 直接调用 dataFetcher.fetchData
        const options = await dataFetcher.fetchData(dataSource as any, {}, ctx);

        logger.info(
          'UseFetchEffects',
          'dependency 变化 - 请求完成',
          {
            optionsCount: options?.length || 0,
          },
          'useEffect_dependency',
        );

        // 🔧 检查组件是否已被销毁（仅记录日志，不阻止setState）
        if ((dataFetcher as any).isDestroyed) {
          utilLogger.warn({
            message: '⚠️ 组件已销毁但继续更新状态（可能是快速重建）',
            data: {
              instanceId: instanceIdRef.current,
              optionsCount: options?.length || 0,
            },
            source: 'SelectBlock',
            component: 'UseFetchEffects',
          });
        }

        // 处理选项数据
        const processedOptions = dataFetcher.processOptions(
          options,
          false,
          undefined,
          ctx,
        );

        // 🔧 修复：更新状态时同时设置 initFetchOptions，确保首次加载的数据能正确显示
        // 🔧 同时记录 dataSource API，用于检测 dataSource 变化
        const dataSourceApi =
          typeof dataSource === 'object' &&
          dataSource !== null &&
          'api' in dataSource
            ? (dataSource as any).api
            : undefined;

        ctx.setState({
          fetchOptions: processedOptions,
          initFetchOptions: processedOptions,
          loading: false,
          fetching: false,
          mounted: true,
          lastDataSourceApi: dataSourceApi,
        });

        utilLogger.info({
          message: '✅ dependency 变化 - 状态更新完成',
          data: {
            finalOptionsCount: processedOptions?.length || 0,
          },
          source: 'SelectBlock',
          component: 'UseFetchEffects',
        });
        logger.info(
          'UseFetchEffects',
          'dependency 变化 - 状态更新完成',
          {
            finalOptionsCount: processedOptions?.length || 0,
          },
          'useEffect_dependency',
        );
      } catch (error) {
        logger.error(
          'UseFetchEffects',
          'dependency 变化 - 请求失败',
          error as Error,
          {
            error: error instanceof Error ? error.message : String(error),
          },
          'useEffect_dependency',
        );
      } finally {
        // 🔧 清除标记
        isDependencyFetchingRef.current = false;
      }
    })();
  }, [
    dependency,
    _canFetch,
    dataSource,
    dataFetcher,
    searchHandler,
    remoteSearchKey,
    value,
  ]); // 🔧 关键修复：移除 currentState，避免无限循环

  // 🔧 添加独立的监控，记录所有相关值的变化
  useEffect(() => {
    logger.debug(
      'UseFetchEffects',
      'dependency 监控 (独立)',
      {
        dependency: JSON.stringify(dependency),
        hasDataSource: Boolean(dataSource),
        dataSourceApi:
          typeof dataSource === 'object' &&
          dataSource !== null &&
          'api' in dataSource
            ? (dataSource as any).api
            : undefined,
        _canFetch,
        hasDataFetcher: Boolean(dataFetcher),
        hasSearchHandler: Boolean(searchHandler),
      },
      'useEffect_dependencyMonitor',
    );
  }, [dependency, dataSource, _canFetch, dataFetcher, searchHandler]);
}
