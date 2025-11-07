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

import { omit } from 'lodash-es';
import { useEffect, useMemo, useRef } from 'react';
import { SelectBlockPluginManager } from '../core/plugin-manager';
import { logger } from '../logger';
import { CacheHandlerPluginImpl } from '../plugins/cache-handler';
import { DataFetcherPluginImpl } from '../plugins/data-fetcher';
import { PaginationPluginImpl } from '../plugins/pagination-handler';
import { PasteHandlerPluginImpl } from '../plugins/paste-handler';
import { SearchHandlerPluginImpl } from '../plugins/search-handler';
import type { SelectOption, veArchSelectBlockProps } from '../types/interface';
import { PluginType } from '../types/plugin';

/**
 * 插件管理器Hook
 * 负责插件管理器的初始化、插件注册和生命周期管理
 */
export function usePluginManager(
  props: veArchSelectBlockProps,
  initialOptions: SelectOption[],
  limit: number,
  addDebugLog: (action: string, data: any) => void,
  hookTraceId: string,
) {
  const {
    handleParams = (v) => omit(v, ['value', 'search']),
    handleOptions = ({ options }) => options,
    searchKey,
    remoteSearchKey,
    multiSearchKeys = [],
    formatRemoteSearchKey = (v: string) => v,

    isScrollFetching = false,
    allowPasteMultiple = false,
    tokenSeparators = ['\n', ',', ';', '\t', ' ', '|', '，', '；'],
    onPaste,
    beforePasteProcess,
    mode,
    cacheKey,
    dataSourceShare = false,
    isFirstHint = false,
  } = props;
  const pluginManagerRef = useRef<SelectBlockPluginManager>();

  // 🔧 添加早期诊断日志
  const currentPluginCount = pluginManagerRef.current?.plugins?.size || 0;
  const needsInitialization =
    !pluginManagerRef.current || currentPluginCount === 0;

  logger.debug(
    'UsePluginManager',
    'Hook 执行开始',
    {
      hasPluginManagerRef: Boolean(pluginManagerRef),
      hasPluginManagerCurrent: Boolean(pluginManagerRef.current),
      currentPluginCount,
      needsInitialization,
    },
    'usePluginManager',
    hookTraceId,
  );

  // 🔧 同步初始化插件管理器 - 如果不存在或插件被清空，都需要重新初始化
  if (needsInitialization) {
    // 如果 pluginManager 存在但插件被清空，先销毁旧的
    if (pluginManagerRef.current) {
      logger.warn(
        'UsePluginManager',
        '检测到空的插件管理器，先销毁再重建',
        {
          oldPluginCount: pluginManagerRef.current.plugins?.size || 0,
        },
        'usePluginManager',
        hookTraceId,
      );
      pluginManagerRef.current.destroy();
      pluginManagerRef.current = undefined;
    }
    logger.info(
      'UsePluginManager',
      '准备创建新的插件管理器',
      {},
      'usePluginManager',
      hookTraceId,
    );

    const manager = new SelectBlockPluginManager();

    logger.debug(
      'UsePluginManager',
      '插件管理器对象已创建',
      {
        hasManager: Boolean(manager),
        managerType: typeof manager,
      },
      'usePluginManager',
      hookTraceId,
    );

    // 🔧 现在使用内置的订阅机制，不需要手动重写setState

    // 设置初始状态
    manager.setState({
      fetchOptions: initialOptions || [],
      initFetchOptions: initialOptions || [],
      fetching: false,
      loading: false,
      skip: 0,
      searchValue: '',
      canTriggerLoadMore: true,
      mounted: false,
    });

    // 设置初始Props
    manager.setProps(props);

    logger.debug(
      'UsePluginManager',
      'Props 已设置，准备注册插件',
      {
        hasManager: Boolean(manager),
        managerPluginCount: manager.plugins?.size || 0,
      },
      'usePluginManager',
      hookTraceId,
    );

    // 注册所有插件
    logger.info(
      'UsePluginManager',
      '开始注册插件',
      { limit },
      'usePluginManager',
      hookTraceId,
    );

    try {
      // 注册数据获取插件
      logger.debug(
        'UsePluginManager',
        '创建 DataFetcher 插件',
        {},
        'usePluginManager',
        hookTraceId,
      );
      const dataFetcher = new DataFetcherPluginImpl({
        limit,
        handleParams,
        handleOptions,
      });
      manager.register(dataFetcher);

      // 注册搜索处理插件
      // 🔧 减少防抖延迟到 100ms，避免在防抖等待期间组件被重新渲染导致插件销毁
      const searchHandler = new SearchHandlerPluginImpl({
        searchKey,
        remoteSearchKey,
        multiSearchKeys,
        formatRemoteSearchKey,
        debounceDelay: 100, // 从 500ms 降低到 100ms
      });
      manager.register(searchHandler);

      // 注册分页插件
      const pagination = new PaginationPluginImpl({
        limit,
        enabled: isScrollFetching,
      });
      manager.register(pagination);

      // 注册粘贴处理插件
      const pasteHandler = new PasteHandlerPluginImpl({
        allowPasteMultiple,
        tokenSeparators,
        onPaste,
        beforePasteProcess,
        mode,
      });
      manager.register(pasteHandler);

      // 注册缓存处理插件
      const cacheHandler = new CacheHandlerPluginImpl({
        cacheKey,
        dataSourceShare,
        isFirstHint,
        autoRemoveDelay: 5000,
      });
      manager.register(cacheHandler);

      // 🔧 设置插件间的引用关系
      if (searchHandler && dataFetcher) {
        searchHandler.setDataFetcher(dataFetcher);
      }
      if (searchHandler && cacheHandler) {
        searchHandler.setCacheHandler(cacheHandler);
      }
      if (dataFetcher && cacheHandler) {
        dataFetcher.setCacheHandler(cacheHandler);
      }

      addDebugLog('PLUGIN_MANAGER_INITIALIZED', {
        pluginCount: manager.plugins.size,
        registeredPlugins: Array.from(manager.plugins.keys()),
      });

      logger.info(
        'UsePluginManager',
        '插件管理器初始化完成',
        {
          pluginCount: manager.plugins.size,
          registeredPlugins: Array.from(manager.plugins.keys()),
        },
        'usePluginManager',
        hookTraceId,
      );
    } catch (error) {
      logger.error(
        'UsePluginManager',
        '插件管理器初始化失败',
        error as Error,
        { error: String(error) },
        'usePluginManager',
        hookTraceId,
      );
      throw error;
    }

    pluginManagerRef.current = manager;

    logger.info(
      'UsePluginManager',
      'pluginManagerRef.current 已赋值',
      {
        hasPluginManagerCurrent: Boolean(pluginManagerRef.current),
        finalPluginCount: pluginManagerRef.current?.plugins?.size || 0,
      },
      'usePluginManager',
      hookTraceId,
    );
  } else {
    logger.debug(
      'UsePluginManager',
      'pluginManager 已存在，跳过初始化',
      {
        pluginCount: pluginManagerRef.current?.plugins?.size || 0,
        registeredPlugins: pluginManagerRef.current
          ? Array.from(pluginManagerRef.current.plugins.keys())
          : [],
      },
      'usePluginManager',
      hookTraceId,
    );
  }

  // 更新插件管理器的props
  // 🔧 修复死循环：完全移除 props 自动更新逻辑
  // pluginManager 在初始化时已经获取了 props 的引用
  // 后续通过 context 共享，不需要手动同步
  // 如果需要更新，应该由具体的业务逻辑触发，而不是在每次渲染时检查

  // 清理插件管理器
  useEffect(() => {
    const currentTraceId = hookTraceId;
    logger.info(
      'UsePluginManager',
      '组件挂载 - 插件管理器激活',
      {
        hasPluginManager: Boolean(pluginManagerRef.current),
        pluginCount: pluginManagerRef.current?.plugins?.size || 0,
        traceId: currentTraceId,
      },
      'useEffect_cleanup',
      currentTraceId,
    );

    return () => {
      logger.warn(
        'UsePluginManager',
        '组件即将卸载 - 准备销毁插件管理器',
        {
          hasPluginManager: Boolean(pluginManagerRef.current),
          pluginCount: pluginManagerRef.current?.plugins?.size || 0,
          traceId: currentTraceId,
        },
        'useEffect_cleanup',
        currentTraceId,
      );

      if (pluginManagerRef.current) {
        pluginManagerRef.current.destroy();
        // 🔧 销毁后清除引用，避免下次渲染时误认为"已存在"
        pluginManagerRef.current = undefined;
      }
    };
  }, []); // ⚠️ 必须是空依赖，否则每次渲染都会触发销毁

  // 获取各个插件的引用 - 总是从当前的 pluginManagerRef 获取，确保获取到最新的插件实例
  // 不能用 useMemo([])，因为那样会缓存旧的插件
  const dataFetcher = pluginManagerRef.current?.getPlugin(
    PluginType.DATA_FETCHER,
  );
  const searchHandler = pluginManagerRef.current?.getPlugin(
    PluginType.SEARCH_HANDLER,
  );
  const paginationHandler = pluginManagerRef.current?.getPlugin(
    PluginType.PAGINATION,
  );
  const pasteHandler = pluginManagerRef.current?.getPlugin(
    PluginType.PASTE_HANDLER,
  );

  // 🔧 添加插件引用获取日志（仅在没有插件时记录警告）
  if (!dataFetcher || !searchHandler) {
    logger.warn(
      'UsePluginManager',
      '插件引用获取失败',
      {
        hasPluginManager: Boolean(pluginManagerRef.current),
        hasDataFetcher: Boolean(dataFetcher),
        hasSearchHandler: Boolean(searchHandler),
        hasPaginationHandler: Boolean(paginationHandler),
        hasPasteHandler: Boolean(pasteHandler),
        pluginCount: pluginManagerRef.current?.plugins?.size || 0,
      },
      'usePluginManager',
      hookTraceId,
    );
  }

  return {
    pluginManagerRef,
    dataFetcher: dataFetcher as any,
    searchHandler: searchHandler as any,
    paginationHandler: paginationHandler as any,
    pasteHandler: pasteHandler as any,
  };
}
