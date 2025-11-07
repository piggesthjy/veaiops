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

import { isEmpty } from 'lodash-es';
import type React from 'react';
import { useCallback } from 'react';
import type { SelectBlockPluginManager } from '../core/plugin-manager';
import { logger } from '../logger';
import type { DataFetcherPluginImpl } from '../plugins/data-fetcher';
import type { PaginationPluginImpl } from '../plugins/pagination-handler';
import type { PasteHandlerPluginImpl } from '../plugins/paste-handler';
import type { SearchHandlerPluginImpl } from '../plugins/search-handler';
import type { SelectOption, veArchSelectBlockProps } from '../types/interface';
import type { SelectBlockState } from '../types/plugin';

/**
 * Event handlers Hook
 * Handles search, paste, visibility change, scroll and other events
 */
export function useEventHandlers(
  props: veArchSelectBlockProps,
  currentState: SelectBlockState,
  searchHandler: SearchHandlerPluginImpl | undefined,
  pasteHandler: PasteHandlerPluginImpl | undefined,
  paginationHandler: PaginationPluginImpl | undefined,
  dataFetcher: DataFetcherPluginImpl | undefined,
  _canFetch: boolean,
  shouldFetchOptionsWithDefaultValue: boolean,
  addDebugLog: (action: string, data: any) => void,
  pluginManagerRef: React.MutableRefObject<
    SelectBlockPluginManager | undefined
  >,
) {
  const {
    formatRemoteSearchKey = (v: string) => v,
    _onSearch,
    isDebouncedFetch = false,
    isScrollFetching = false,
    remoteSearchKey,
    value,
    options: initialOptions = [],
  } = props;

  // Search handler - fix missing onSearch logic
  const onSearch = isDebouncedFetch
    ? (v: string, reason?: string) => {
        logger.info(
          'UseEventHandlers',
          'onSearch triggered',
          {
            searchValue: v,
            reason,
            currentSearchValue: currentState?.searchValue,
            isDebouncedFetch,
          },
          'onSearch',
        );

        if (v === currentState?.searchValue || reason === 'optionListHide') {
          logger.debug(
            'UseEventHandlers',
            'onSearch skipped - value unchanged or option list hidden',
            {
              sameValue: v === currentState?.searchValue,
              optionListHide: reason === 'optionListHide',
            },
            'onSearch',
          );
          return;
        }

        // Update search value to state
        pluginManagerRef.current?.setState({
          searchValue: v,
        });

        // Call external search callback
        _onSearch?.({ search: v });

        logger.info(
          'UseEventHandlers',
          'onSearch preparing to create debounced search',
          {
            hasSearchHandler: Boolean(searchHandler),
          },
          'onSearch',
        );

        // 🔥 Key: Trigger data fetch (regardless of whether input is empty)
        const debouncedSearch = searchHandler?.createDebouncedSearch();

        logger.info(
          'UseEventHandlers',
          'onSearch calling debounced search',
          {
            hasDebouncedSearch: Boolean(debouncedSearch),
            inputValue: v,
          },
          'onSearch',
        );

        debouncedSearch?.({ inputValue: v });

        addDebugLog('ON_SEARCH_TRIGGERED', {
          searchValue: v,
          reason,
          timestamp: Date.now(),
        });
      }
    : (searchValue: string) => {
        logger.debug(
          'UseEventHandlers',
          'onSearch (非防抖模式)',
          {
            searchValue,
          },
          'onSearch',
        );
        _onSearch?.({ search: searchValue });
      };

  // Internal method to fetch options - keep consistent with original file
  // 🔧 Fix infinite loop: Remove object dependencies, use ref to access latest state
  const _fetchOptions = useCallback(async () => {
    // 🔍 Extract instance identifier
    const instanceId =
      props.id || (props as any).formItemProps?.field || 'unknown';

    // 🔍 Extract complete dataSource information
    const dataSourceInfo =
      props.dataSource && typeof props.dataSource === 'object'
        ? {
            api: (props.dataSource as any).api,
            hasServiceInstance: 'serviceInstance' in props.dataSource,
            responseEntityKey: (props.dataSource as any).responseEntityKey,
          }
        : null;

    // 🔍 Extract complete dependency information
    const dependencyInfo = {
      dependency: props.dependency,
      dependencyString: JSON.stringify(props.dependency),
      dependencyType: typeof props.dependency,
      dependencyIsArray: Array.isArray(props.dependency),
      dependencyLength: Array.isArray(props.dependency)
        ? props.dependency.length
        : 0,
      dependencyFirstItem: Array.isArray(props.dependency)
        ? props.dependency[0]
        : undefined,
    };

    logger.info(
      'UseEventHandlers',
      '_fetchOptions called',
      {
        instanceId, // 🔍 Instance identifier
        hasDataFetcher: Boolean(dataFetcher),
        hasSearchHandler: Boolean(searchHandler),
        hasCurrentState: Boolean(currentState),
        shouldFetchOptionsWithDefaultValue,
        remoteSearchKey,
        value,
        // 🔍 Complete dataSource information
        dataSourceInfo,
        dataSourceApi: dataSourceInfo?.api,
        // 🔍 Complete dependency information
        ...dependencyInfo,
        // 🔍 Current status information
        lastDataSourceApi: currentState?.lastDataSourceApi,
        fetchOptionsCount: currentState?.fetchOptions?.length || 0,
      },
      '_fetchOptions',
    );

    if (!dataFetcher || !searchHandler || !currentState) {
      addDebugLog('FETCH_OPTIONS_SKIPPED', {
        hasDataFetcher: Boolean(dataFetcher),
        hasSearchHandler: Boolean(searchHandler),
        hasCurrentState: Boolean(currentState),
      });
      logger.warn(
        'UseEventHandlers',
        '_fetchOptions skipped - missing required plugins or state',
        {
          hasDataFetcher: Boolean(dataFetcher),
          hasSearchHandler: Boolean(searchHandler),
          hasCurrentState: Boolean(currentState),
        },
        '_fetchOptions',
      );
      return;
    }

    // 🔧 Fix: Update PluginManager's context.props before creating debounced function
    // Ensure debounced function captures the latest props (especially dataSource)
    if (pluginManagerRef.current) {
      pluginManagerRef.current.setProps(props);
      logger.debug(
        'UseEventHandlers',
        'Updated PluginManager context.props',
        {
          dataSourceApi: dataSourceInfo?.api,
          hasPluginManager: Boolean(pluginManagerRef.current),
        },
        '_fetchOptions',
      );
    }

    logger.debug(
      'UseEventHandlers',
      'Creating debounced search function',
      {
        hasSearchHandler: Boolean(searchHandler),
      },
      '_fetchOptions',
    );

    const debouncedSearch = searchHandler.createDebouncedSearch();

    logger.debug(
      'UseEventHandlers',
      'Debounced search function created',
      {
        hasDebouncedSearch: Boolean(debouncedSearch),
        shouldFetchOptionsWithDefaultValue,
        remoteSearchKey,
        mounted: currentState.mounted,
      },
      '_fetchOptions',
    );

    if (shouldFetchOptionsWithDefaultValue && remoteSearchKey) {
      if (!currentState.mounted) {
        logger.info(
          'UseEventHandlers',
          'Executing initial value search',
          {
            initValue: value,
            isOptionAppend: true,
          },
          '_fetchOptions',
        );
        await debouncedSearch({
          initValue: value,
          isOptionAppend: true,
        });
      } else {
        logger.info(
          'UseEventHandlers',
          'Executing empty search (mounted)',
          {},
          '_fetchOptions',
        );
        await debouncedSearch({});
      }
    } else {
      logger.info(
        'UseEventHandlers',
        'Executing normal search',
        {
          shouldFetchOptionsWithDefaultValue,
          remoteSearchKey,
        },
        '_fetchOptions',
      );
      await debouncedSearch({});
    }

    logger.info(
      'UseEventHandlers',
      '_fetchOptions execution completed',
      {
        instanceId, // 🔍 Instance identifier
        dataSourceApi: dataSourceInfo?.api,
      },
      '_fetchOptions',
    );
  }, [
    // 🔧 Remove currentState dependency as it's accessed via closure
    dataFetcher,
    searchHandler,
    shouldFetchOptionsWithDefaultValue,
    remoteSearchKey,
    value,
    // 🔍 Add key fields from props to dependency array to ensure using latest values
    props.id,
    JSON.stringify(props.dependency),
    JSON.stringify(props.dataSource),
  ]);

  // Visibility change handler - fix missing reset logic
  // 🔧 Fix infinite loop: Simplify dependency array
  const handleVisibleChange = useCallback(
    (visible: boolean) => {
      // 🔍 Extract instance identifier
      const instanceId =
        props.id || (props as any).formItemProps?.field || 'unknown';

      // 🔍 Extract complete dataSource information
      const dataSourceInfo =
        props.dataSource && typeof props.dataSource === 'object'
          ? {
              api: (props.dataSource as any).api,
              hasServiceInstance: 'serviceInstance' in props.dataSource,
              responseEntityKey: (props.dataSource as any).responseEntityKey,
            }
          : null;

      // 🔍 Extract complete dependency information
      const dependencyInfo = {
        dependency: props.dependency,
        dependencyString: JSON.stringify(props.dependency),
        dependencyType: typeof props.dependency,
        dependencyIsArray: Array.isArray(props.dependency),
        dependencyLength: Array.isArray(props.dependency)
          ? props.dependency.length
          : 0,
        dependencyFirstItem: Array.isArray(props.dependency)
          ? props.dependency[0]
          : undefined,
      };

      logger.info(
        'UseEventHandlers',
        'Visibility changed',
        {
          instanceId, // 🔍 Instance identifier
          visible,
          hasFetchOptions: !isEmpty(currentState?.fetchOptions),
          fetchOptionsCount: currentState?.fetchOptions?.length || 0,
          _canFetch,
          // 🔍 Complete dataSource information
          dataSourceInfo,
          dataSourceApi: dataSourceInfo?.api,
          // 🔍 Complete dependency information
          ...dependencyInfo,
          // 🔍 Current status information
          lastDataSourceApi: currentState?.lastDataSourceApi,
        },
        'handleVisibleChange',
      );

      addDebugLog('VISIBLE_CHANGE', { visible });

      if (visible && isEmpty(currentState?.fetchOptions) && _canFetch) {
        // 🔧 Fix: Update PluginManager's context.props before fetching data
        // Ensure debounced function captures the latest props (especially dataSource)
        if (pluginManagerRef.current) {
          pluginManagerRef.current.setProps(props);
          logger.debug(
            'UseEventHandlers',
            'Dropdown opened - options empty, updated PluginManager context.props',
            {
              instanceId, // 🔍 Instance identifier
              dataSourceApi: dataSourceInfo?.api,
            },
            'handleVisibleChange',
          );
        }

        logger.info(
          'UseEventHandlers',
          'Dropdown opened - options empty, preparing to fetch data',
          {
            instanceId, // 🔍 Instance identifier
            fetchOptionsEmpty: isEmpty(currentState?.fetchOptions),
            _canFetch,
            dataSourceInfo, // 🔍 Complete dataSource information
            dataSourceApi: dataSourceInfo?.api,
            ...dependencyInfo, // 🔍 Complete dependency information
            lastDataSourceApi: currentState?.lastDataSourceApi,
          },
          'handleVisibleChange',
        );
        _fetchOptions();
      } else if (visible && !isEmpty(currentState?.fetchOptions)) {
        // 🔧 Fix: Check if dataSource has changed (by comparing api field)
        // When dependency changes, dataSource also changes, old options may no longer be applicable

        // 🔧 Edge case 1: Check if pluginManagerRef exists
        if (!pluginManagerRef.current) {
          logger.warn(
            'UseEventHandlers',
            '⚠️ Dropdown opened - pluginManagerRef.current does not exist',
            {},
            'handleVisibleChange',
          );
          return;
        }

        // 🔧 Edge case 2: Extract currentApi, handle various dataSource types
        const currentApi =
          props.dataSource &&
          typeof props.dataSource === 'object' &&
          'api' in props.dataSource
            ? (props.dataSource as any).api
            : undefined;

        const lastApi = currentState?.lastDataSourceApi;

        // 🔧 Edge case 3: Handle various change scenarios
        // - lastApi doesn't exist && currentApi exists -> First open, need to fetch
        // - lastApi exists && currentApi exists && different -> dataSource changed, need to refetch
        // - lastApi exists && currentApi doesn't exist -> dataSource cleared, no need to fetch
        // - Both don't exist -> No dataSource, no need to fetch
        const dataSourceChanged = Boolean(
          currentApi && (!lastApi || lastApi !== currentApi),
        );

        // 🔧 Detailed logging: Record API comparison process
        logger.info(
          'UseEventHandlers',
          '🔍 Dropdown opened - detecting dataSource changes',
          {
            instanceId, // 🔍 Instance identifier
            currentApi,
            lastApi,
            hasCurrentApi: Boolean(currentApi),
            hasLastApi: Boolean(lastApi),
            apiMatches: currentApi === lastApi,
            dataSourceChanged,
            fetchOptionsCount: currentState?.fetchOptions?.length || 0,
            // 🔍 Complete dataSource information
            dataSourceInfo,
            // 🔍 Complete dependency information
            ...dependencyInfo,
            // 🔍 Current status information
            currentStateLastApi: currentState?.lastDataSourceApi,
          },
          'handleVisibleChange',
        );

        if (dataSourceChanged) {
          logger.info(
            'UseEventHandlers',
            '✅ Dropdown opened - dataSource changed, clearing options and refetching',
            {
              instanceId, // 🔍 Instance identifier
              oldApi: lastApi,
              newApi: currentApi,
              // 🔍 Complete dataSource information
              dataSourceInfo,
              // 🔍 Complete dependency information
              ...dependencyInfo,
            },
            'handleVisibleChange',
          );

          // 🔧 Edge case 4: Check if searchHandler exists before clearing old debounced function
          if (searchHandler && 'clearDebouncedSearch' in searchHandler) {
            (searchHandler as any).clearDebouncedSearch();
            logger.info(
              'UseEventHandlers',
              '✅ Dropdown opened - dataSource changed, cleared old debounced function',
              {
                oldApi: lastApi,
                newApi: currentApi,
              },
              'handleVisibleChange',
            );
          } else {
            logger.warn(
              'UseEventHandlers',
              '⚠️ Dropdown opened - searchHandler does not exist or has no clearDebouncedSearch method',
              {
                hasSearchHandler: Boolean(searchHandler),
                hasClearMethod:
                  searchHandler && 'clearDebouncedSearch' in searchHandler,
              },
              'handleVisibleChange',
            );
          }

          // 🔧 Fix: Update PluginManager's context.props before refetching data
          // Ensure debounced function captures the latest props (especially dataSource)
          if (pluginManagerRef.current) {
            pluginManagerRef.current.setProps(props);
            logger.debug(
              'UseEventHandlers',
              '✅ Dropdown opened - dataSource changed, updated PluginManager context.props',
              {
                oldApi: lastApi,
                newApi: currentApi,
                dataSourceApi: dataSourceInfo?.api,
              },
              'handleVisibleChange',
            );
          }

          // 🔧 Edge case 5: Ensure pluginManagerRef.current exists before clearing options
          if (pluginManagerRef.current) {
            pluginManagerRef.current.setState({
              fetchOptions: [],
              initFetchOptions: [],
              lastDataSourceApi: currentApi,
            });
          }

          // 🔧 Edge case 6: Check conditions before refetching data
          if (_canFetch && currentApi) {
            logger.info(
              'UseEventHandlers',
              '✅ Dropdown opened - preparing to refetch data',
              {
                instanceId, // 🔍 Instance identifier
                _canFetch,
                currentApi,
                // 🔍 Complete dataSource information
                dataSourceInfo,
                // 🔍 Complete dependency information
                ...dependencyInfo,
              },
              'handleVisibleChange',
            );
            _fetchOptions();
          } else {
            logger.warn(
              'UseEventHandlers',
              '⚠️ Dropdown opened - unable to refetch data',
              {
                instanceId, // 🔍 Instance identifier
                _canFetch,
                currentApi,
                reason: !_canFetch
                  ? 'canFetch is false'
                  : 'currentApi does not exist',
                // 🔍 Complete dataSource information
                dataSourceInfo,
                // 🔍 Complete dependency information
                ...dependencyInfo,
              },
              'handleVisibleChange',
            );
          }
        } else {
          logger.debug(
            'UseEventHandlers',
            'Dropdown opened - options already exist, no need to fetch',
            {
              instanceId, // 🔍 Instance identifier
              fetchOptionsCount: currentState?.fetchOptions?.length || 0,
              currentApi,
              lastApi,
              dataSourceChanged,
              // 🔍 Complete dataSource information
              dataSourceInfo,
              // 🔍 Complete dependency information
              ...dependencyInfo,
            },
            'handleVisibleChange',
          );
        }
      } else if (!visible) {
        logger.debug(
          'UseEventHandlers',
          'Dropdown closed - resetting state',
          {},
          'handleVisibleChange',
        );
        // 🔥 Key: Reset state when dropdown is hidden (consistent with original version)
        paginationHandler?.resetPagination?.(); // Reset pagination state

        // Reset loading/fetching state
        pluginManagerRef.current?.setState({
          fetching: false,
        });

        // If there are initial options, restore to initial state
        if (initialOptions && initialOptions.length > 0) {
          // Ensure initialOptions are converted to correct SelectOption[] format
          const selectOptions: SelectOption[] = initialOptions.map((option) => {
            if (typeof option === 'string' || typeof option === 'number') {
              return { label: String(option), value: option };
            }
            return option as SelectOption;
          });

          pluginManagerRef.current?.setState({
            fetchOptions: selectOptions,
          });
        }

        addDebugLog('VISIBLE_CHANGE_RESET', {
          reason: 'dropdown_hidden',
          resetStates: ['pagination', 'fetching', 'fetchOptions'],
        });
      }
    },
    // 🔧 Add props.dataSource and props.dependency to dependency array to ensure using latest values
    [
      _canFetch,
      _fetchOptions,
      paginationHandler,
      initialOptions,
      // 🔧 Add: Ensure handleVisibleChange is recreated when dataSource or dependency changes
      // Use JSON.stringify to detect when object references change
      JSON.stringify(props.dataSource),
      JSON.stringify(props.dependency),
    ],
  );

  // Scroll handler
  // 🔧 Fix infinite loop: Remove currentState destructuring dependency
  const popupScrollHandler = useCallback(
    (e: any) => {
      if (!isScrollFetching || !paginationHandler) {
        return;
      }

      const { target } = e;

      // Defensive check: Ensure target exists
      if (!target) {
        console.warn(
          '[ScrollHandler] Event target is undefined, skipping scroll handling',
        );
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = target;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

      if (
        isNearBottom &&
        currentState?.canTriggerLoadMore &&
        !currentState?.fetching
      ) {
        addDebugLog('SCROLL_LOAD_MORE', {
          scrollTop,
          scrollHeight,
          clientHeight,
          canTriggerLoadMore: currentState?.canTriggerLoadMore,
          fetching: currentState?.fetching,
        });

        // Trigger load more
        const currentSearchValue = currentState?.searchValue || '';
        const formattedSearchValue = formatRemoteSearchKey(currentSearchValue);

        // Trigger scroll to load more data
        const debouncedSearch = searchHandler?.createDebouncedSearch();
        debouncedSearch?.({
          scroll: true,
          inputValue: formattedSearchValue,
        });
      }
    },
    // 🔧 Remove currentState destructuring dependency, access via closure
    [isScrollFetching, paginationHandler, formatRemoteSearchKey, searchHandler],
  );

  // Clear handler - trigger refetch when user clicks clear button
  // 🔧 Fix infinite loop: Simplify dependencies
  const handleClear = useCallback(
    (visible: boolean) => {
      addDebugLog('CLEAR_TRIGGERED', {
        visible,
        _canFetch,
        hasDataSource: Boolean(props.dataSource),
      });

      // Only trigger refetch when there is a data source and can fetch data
      if (_canFetch && props.dataSource) {
        // Delay a short time to ensure value has been cleared
        setTimeout(() => {
          addDebugLog('CLEAR_REFETCH', {
            reason: 'value cleared, refetching data',
          });
          _fetchOptions();
        }, 50);
      }

      // Call original onClear callback
      props.onClear?.(visible);
    },
    [_canFetch, _fetchOptions],
  );

  return {
    onSearch,
    handlePaste: pasteHandler?.handlePaste
      ? (event: ClipboardEvent) => pasteHandler.handlePaste(event)
      : (((_event: ClipboardEvent) => {}) as (event: ClipboardEvent) => void),
    handleVisibleChange,
    handleClear,
    popupScrollHandler,
    _fetchOptions,
  };
}
