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

import { debounce } from 'lodash-es';
import { logger } from '../../logger';
import type { SearchKeyConfig } from '../../types/interface';
import type {
  CacheHandlerPlugin,
  DataFetcherPlugin,
  PluginContext,
  SearchHandlerConfig,
  SearchHandlerPlugin,
  SearchParams,
} from '../../types/plugin';
import { isDataSourceSetter } from '../../util';

/**
 * Check if input is numeric
 */
function isNumericString(str: string): boolean {
  return /^\d+$/.test(str);
}

/**
 * Search handler plugin implementation
 */
export class SearchHandlerPluginImpl implements SearchHandlerPlugin {
  name = 'search-handler';

  config: SearchHandlerConfig;

  private context!: PluginContext;

  private debouncedSearchFn?: any;

  private dataFetcherRef?: DataFetcherPlugin;

  private cacheHandlerRef?: CacheHandlerPlugin;

  // 🔧 Add destroy flag to prevent execution after destruction
  private isDestroyed = false;

  // 🔧 Add debug logging system
  private debugLogs: Array<{
    action: string;
    data: any;
    timestamp: number;
    time: string;
  }> = [];

  // 🔧 Loop detection flag
  private isProcessingStateReset = false;

  constructor(config: SearchHandlerConfig) {
    this.config = {
      debounceDelay: 500,
      ...config,
    };

    // 🔧 Expose debug methods to global scope for debugging
    this.exposeDebugMethods();

    // 🔧 Setup emergency state reset listener
    this.setupEmergencyStateResetListener();
  }

  /**
   * Setup emergency state reset listener
   * Used to handle React state and DOM synchronization issues
   */
  private setupEmergencyStateResetListener(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('forceStateReset', (event: any) => {
        // 🚨 Prevent infinite loop: Skip if already processing state reset
        if (this.isProcessingStateReset) {
          this.addDebugLog('EMERGENCY_STATE_RESET_SKIPPED', {
            reason: 'prevent infinite loop',
            timestamp: Date.now(),
          });
          return;
        }

        try {
          this.isProcessingStateReset = true;
          const detail = event.detail || { loading: false, fetching: false };

          this.addDebugLog('EMERGENCY_STATE_RESET', {
            detail,
            timestamp: Date.now(),
          });

          // Force reset state (React state only, don't call DOM sync to avoid loop)
          if (this.context) {
            this.context.setState({
              loading: detail.loading,
              fetching: detail.fetching,
            });

            // 🔧 Use fallback solution to directly manipulate DOM, avoid circular calls
            this.fallbackDOMSync(detail.loading);

            this.addDebugLog('EMERGENCY_STATE_RESET_SUCCESS', {
              newState: detail,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          this.addDebugLog('EMERGENCY_STATE_RESET_ERROR', {
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          });
        } finally {
          // 🔧 Reset loop detection flag
          this.isProcessingStateReset = false;
        }
      });
    }
  }

  /**
   * 🔧 Add debug log
   */
  private addDebugLog(action: string, data: any): void {
    const logEntry = {
      action: `[SearchHandler] ${action}`,
      data,
      timestamp: Date.now(),
      time: new Date().toISOString(),
    };

    this.debugLogs.push(logEntry);
    // Keep log count within reasonable range
    if (this.debugLogs.length > 200) {
      this.debugLogs = this.debugLogs.slice(-100);
    }

    // 🔧 Also use logger output to ensure it can be collected by log-exporter
    logger.debug('SearchHandler', action, data, action);
  }

  /**
   * 🔧 Expose debug methods to global scope
   */
  private exposeDebugMethods(): void {
    // Get debug logs
    (window as any).getSearchHandlerDebugLogs = () => {
      return this.debugLogs;
    };

    // Clear debug logs
    (window as any).clearSearchHandlerDebugLogs = () => {
      this.debugLogs = [];
    };

    // Export debug logs
    (window as any).exportSearchHandlerDebugLogs = () => {
      const logData = {
        plugin: 'SearchHandlerPluginImpl',
        timestamp: new Date().toISOString(),
        totalLogs: this.debugLogs.length,
        config: this.config,
        logs: this.debugLogs,
      };

      const jsonStr = JSON.stringify(logData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `search-handler-debug-${timestamp}.json`;

      // Create download link
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return logData;
    };
  }

  init(context: PluginContext): void {
    this.context = context;
  }

  /**
   * Set data fetcher plugin reference
   */
  setDataFetcher(dataFetcher: DataFetcherPlugin): void {
    this.dataFetcherRef = dataFetcher;
  }

  setCacheHandler(cacheHandler: CacheHandlerPlugin): void {
    this.cacheHandlerRef = cacheHandler;
  }

  /**
   * Get search parameters
   */
  getSearchParams(inputValue: string): Record<string, any> {
    if (!inputValue) {
      return {};
    }

    const {
      searchKey,
      remoteSearchKey,
      multiSearchKeys,
      formatRemoteSearchKey = (v: string) => v,
    } = this.config;

    const formattedValue = formatRemoteSearchKey(inputValue);

    // If multiSearchKeys array is set, use it first
    if (multiSearchKeys && multiSearchKeys.length > 0) {
      const params: Record<string, any> = {};

      // Iterate through multi-search field configurations
      multiSearchKeys.forEach((keyConfig: SearchKeyConfig) => {
        // If it's an object configuration, contains key and valueType
        if (typeof keyConfig === 'object' && keyConfig.key) {
          const { key, valueType } = keyConfig;

          // Process value based on valueType
          if (valueType === 'number' && isNumericString(formattedValue)) {
            params[key] = Number(formattedValue);
          } else if (valueType === 'string' || !valueType) {
            params[key] = formattedValue;
          }
        } else if (typeof keyConfig === 'string') {
          // If it's a simple string configuration
          params[keyConfig] = formattedValue;
        }
      });

      return params;
    }

    // Compatible with original single search logic
    // Prefer remoteSearchKey, then searchKey, finally default search
    if (remoteSearchKey) {
      return {
        [remoteSearchKey]: formattedValue,
      };
    }

    return searchKey
      ? {
          [searchKey]: formattedValue,
        }
      : {
          search: formattedValue,
        };
  }

  /**
   * Create debounced search function
   */
  createDebouncedSearch(): any {
    this.addDebugLog('CREATE_DEBOUNCED_SEARCH_CALLED', {
      hasDebouncedSearchFn: Boolean(this.debouncedSearchFn),
      timestamp: Date.now(),
    });

    if (this.debouncedSearchFn) {
      this.addDebugLog('REUSE_EXISTING_DEBOUNCED_SEARCH', {
        timestamp: Date.now(),
      });
      return this.debouncedSearchFn;
    }

    this.addDebugLog('CREATE_NEW_DEBOUNCED_SEARCH', {
      debounceDelay: this.config.debounceDelay,
      timestamp: Date.now(),
    });

    // 🔧 Capture current context, dataFetcher, cacheHandler references when creating debounced function
    // This way even if plugin is destroyed, debounced function can still access these references
    const capturedContext = this.context;
    const capturedDataFetcher = this.dataFetcherRef;
    const capturedCacheHandler = this.cacheHandlerRef;
    const capturedAddDebugLog = this.addDebugLog.bind(this);

    // 🔍 Extract captured dataSource API for debugging
    const capturedDataSourceApi =
      capturedContext?.props?.dataSource &&
      typeof capturedContext.props.dataSource === 'object' &&
      'api' in capturedContext.props.dataSource
        ? (capturedContext.props.dataSource as any).api
        : undefined;

    // 🔧 Add logging when capturing
    logger.debug(
      'SearchHandler',
      'Captured context reference',
      {
        hasCapturedContext: Boolean(capturedContext),
        capturedContextType: typeof capturedContext,
        hasCapturedDataFetcher: Boolean(capturedDataFetcher),
        hasCapturedCacheHandler: Boolean(capturedCacheHandler),
        isDestroyed: this.isDestroyed,
        // 🔍 Record captured dataSource API
        capturedDataSourceApi,
        hasCapturedDataSource: Boolean(capturedContext?.props?.dataSource),
      },
      'createDebouncedSearch',
    );

    this.debouncedSearchFn = debounce(
      async ({
        initValue,
        inputValue,
        scroll,
        isOptionAppend = false,
      }: SearchParams) => {
        // 🔧 Note: Must use original addDebugLog here, as capturedAddDebugLog may access destroyed context
        logger.debug(
          'SearchHandler',
          'DEBOUNCED_SEARCH_FUNCTION_EXECUTED',
          {
            initValue,
            inputValue,
            scroll,
            isOptionAppend,
            timestamp: Date.now(),
            hasCapturedContext: Boolean(capturedContext),
            capturedContextType: typeof capturedContext,
            // 🔍 Record captured dataSource API (closure variable)
            capturedDataSourceApi,
          },
          'createDebouncedSearch',
        );

        // 🔧 Use captured context instead of this.context
        if (!capturedContext) {
          logger.warn(
            'SearchHandler',
            'DEBOUNCED_SEARCH_ABORT - capturedContext is null',
            {
              timestamp: Date.now(),
              capturedContextType: typeof capturedContext,
              capturedContextIsNull: capturedContext === null,
              capturedContextIsUndefined: capturedContext === undefined,
            },
            'createDebouncedSearch',
          );
          return false;
        }

        const { props } = capturedContext;

        // 🔍 Extract currently used dataSource API for debugging
        const currentDataSourceApi =
          props?.dataSource &&
          typeof props.dataSource === 'object' &&
          'api' in props.dataSource
            ? (props.dataSource as any).api
            : undefined;

        // 🔧 Record search start
        logger.info(
          'SearchHandler',
          'DEBOUNCED_SEARCH_START',
          {
            initValue,
            inputValue,
            scroll,
            isOptionAppend,
            dataSource: props.dataSource ? 'present' : 'missing',
            // 🔍 Record currently used dataSource API
            currentDataSourceApi,
            // 🔍 Compare captured API with currently used API
            apiMatches: currentDataSourceApi === capturedDataSourceApi,
          },
          'createDebouncedSearch',
        );

        if (!props.dataSource) {
          logger.warn(
            'SearchHandler',
            'DEBOUNCED_SEARCH_ABORT - no dataSource',
            {},
            'createDebouncedSearch',
          );
          return false;
        }

        // 🔧 Record loading start time to ensure minimum loading duration
        const loadingStartTime = Date.now();

        // 🔧 Record loading state setting
        logger.debug(
          'SearchHandler',
          'LOADING_STATE_SET_TRUE',
          {
            loadingStartTime,
            timestamp: Date.now(),
          },
          'createDebouncedSearch',
        );

        // 🔧 Merge state updates to avoid multiple re-renders - use captured context
        const { state } = capturedContext;
        const { limit } = capturedContext.props.pageReq || { limit: 100 };
        const newSkip = scroll ? state.skip + limit : 0;

        capturedContext.setState({
          loading: true,
          fetching: true,
          skip: newSkip,
        });
        // Check cache
        if (props.cacheKey !== undefined && capturedCacheHandler) {
          const optionsInCache = capturedCacheHandler.getFromCache(
            props.cacheKey,
          );
          if (optionsInCache) {
            // Schedule delayed cache removal
            capturedCacheHandler.scheduleRemoval(props.cacheKey);
            return optionsInCache;
          }
        }

        // Build search parameters
        let remoteSearchParams = {};

        // case 1: Initial value echo
        if (initValue && this.config.remoteSearchKey) {
          remoteSearchParams = { [this.config.remoteSearchKey]: initValue };
        }

        // case 2: Input value search
        if (inputValue) {
          remoteSearchParams = this.getSearchParams(inputValue);
        }

        try {
          // Use captured dataFetcher
          const dataFetcher = capturedDataFetcher;
          if (!dataFetcher) {
            logger.warn(
              'SearchHandler',
              'DEBOUNCED_SEARCH_ABORT - no dataFetcher',
              {},
              'createDebouncedSearch',
            );
            return false;
          }

          // Get API name for debugging
          const apiName = isDataSourceSetter(props.dataSource)
            ? props.dataSource.api
            : 'Function';

          // 🔧 Record API request start
          logger.info(
            'SearchHandler',
            'API_REQUEST_START',
            {
              apiName,
              remoteSearchParams,
              timestamp: Date.now(),
              timeSinceLoadingStart: Date.now() - loadingStartTime,
            },
            'createDebouncedSearch',
          );

          // Fetch options data - pass captured context
          const options = await dataFetcher.fetchData(
            props.dataSource,
            remoteSearchParams,
            capturedContext,
          );

          // 🔧 Record API request completion
          logger.info(
            'SearchHandler',
            'API_REQUEST_COMPLETE',
            {
              apiName,
              optionsCount: options?.length || 0,
              timestamp: Date.now(),
              apiDuration: Date.now() - loadingStartTime,
            },
            'createDebouncedSearch',
          );

          // Process options data - pass captured context
          const processedOptions = dataFetcher.processOptions(
            options,
            scroll || isOptionAppend,
            apiName,
            capturedContext,
          );

          // Update state - ensure atomic state updates - use captured context
          const { state: currentState } = capturedContext;
          const limit = props?.pageReq?.limit || 100;

          // 🔧 Record current dataSource API for detecting dataSource changes
          const currentDataSourceApi = isDataSourceSetter(props.dataSource)
            ? props.dataSource.api
            : undefined;

          const newState: any = {
            fetchOptions: processedOptions,
            canTriggerLoadMore: options?.length >= limit,
            // 🔧 Merge loading state reset to avoid multiple re-renders
            loading: false,
            fetching: false,
            // 🔧 Record dataSource API for detecting dataSource changes
            lastDataSourceApi: currentDataSourceApi,
          };

          if (!currentState.mounted) {
            newState.initFetchOptions = processedOptions;
            newState.mounted = true;
          }

          // 🔧 Immediately reset loading state - remove delay to ensure state sync
          const elapsedTime = Date.now() - loadingStartTime;

          // 🔧 Record loading reset - no delay version
          logger.debug(
            'SearchHandler',
            'LOADING_STATE_SET_FALSE_SUCCESS',
            {
              elapsedTime,
              totalDuration: elapsedTime,
              timestamp: Date.now(),
            },
            'createDebouncedSearch',
          );

          // 🔧 Record state update
          logger.info(
            'SearchHandler',
            'STATE_UPDATE_OPTIONS',
            {
              processedOptionsCount: processedOptions?.length || 0,
              mounted: newState.mounted,
              canTriggerLoadMore: newState.canTriggerLoadMore,
              timestamp: Date.now(),
            },
            'createDebouncedSearch',
          );

          // 🔧 Update all state at once to avoid multiple re-renders - use captured context
          capturedContext.setState(newState);

          // 🔧 Also use direct options passing mechanism to bypass React state async issues
          try {
            const setDirectOptionsFunc = (window as any)[
              `setDirectOptions_${apiName}`
            ];
            if (setDirectOptionsFunc) {
              setDirectOptionsFunc(processedOptions);
            }
          } catch (error) {}

          // Only log pagination state, no longer duplicate state updates

          return true;
        } catch (error) {
          // 🔧 Record API request error
          logger.error(
            'SearchHandler',
            'API_REQUEST_ERROR',
            error as Error,
            {
              error: error instanceof Error ? error.message : String(error),
              timestamp: Date.now(),
              errorDuration: Date.now() - loadingStartTime,
            },
            'createDebouncedSearch',
          );

          // 🔧 Immediately reset loading state - no delay even on error
          const elapsedTime = Date.now() - loadingStartTime;

          // 🔧 Record loading state reset on error
          logger.debug(
            'SearchHandler',
            'LOADING_STATE_SET_FALSE_ERROR',
            {
              elapsedTime,
              totalDuration: elapsedTime,
              timestamp: Date.now(),
            },
            'createDebouncedSearch',
          );
          // Immediately reset state to ensure correct reset on error - use captured context
          capturedContext.setState({
            loading: false,
            fetching: false,
          });

          return false;
        }
      },
      this.config.debounceDelay,
    );

    return this.debouncedSearchFn;
  }

  /**
   * Get data fetcher plugin
   */
  private getDataFetcherPlugin() {
    return this.dataFetcherRef;
  }

  /**
   * Create search callback function
   */
  createSearchCallback(): (v: string, reason: string) => void {
    return (v: string, reason: string) => {
      // 🔧 Add context null check
      if (!this.context) {
        this.addDebugLog('SEARCH_CALLBACK_ABORT', {
          reason: 'context is null',
          inputValue: v,
          timestamp: Date.now(),
        });
        return;
      }

      const { state } = this.context;

      // 🔧 Record search callback trigger
      this.addDebugLog('SEARCH_CALLBACK_TRIGGERED', {
        inputValue: v,
        reason,
        currentSearchValue: state.searchValue,
        currentLoading: state.loading,
        timestamp: Date.now(),
      });

      if (v === state.searchValue || reason === 'optionListHide') {
        this.addDebugLog('SEARCH_CALLBACK_SKIPPED', {
          reason: v === state.searchValue ? 'same_value' : 'option_list_hide',
          inputValue: v,
          callbackReason: reason,
        });
        return;
      }

      // Call user-defined search callback
      const { props } = this.context;
      if (props._onSearch) {
        this.addDebugLog('USER_SEARCH_CALLBACK_CALLED', {
          inputValue: v,
          timestamp: Date.now(),
        });
        props._onSearch({ search: v });
      }

      // 🔧 Record about to trigger debounced search
      this.addDebugLog('DEBOUNCED_SEARCH_TRIGGER', {
        inputValue: v,
        debounceDelay: this.config.debounceDelay,
        timestamp: Date.now(),
      });

      // Trigger search
      const debouncedSearch = this.createDebouncedSearch();
      debouncedSearch({ inputValue: v });
    };
  }

  /**
   * Reset search state
   */
  resetSearch(): void {
    if (!this.context) {
      this.addDebugLog('RESET_SEARCH_ABORT', {
        reason: 'context is null',
        timestamp: Date.now(),
      });
      return;
    }
    this.context.setState({
      searchValue: '',
      skip: 0,
      canTriggerLoadMore: true,
      fetching: false,
      loading: false, // Ensure loading state is also reset
    });
  }

  /**
   * Clear debounced function, force recreation
   * 🔧 Called when dependency changes to ensure new debounced function uses latest dataSource
   */
  clearDebouncedSearch(): void {
    if (
      this.debouncedSearchFn &&
      typeof this.debouncedSearchFn.cancel === 'function'
    ) {
      this.debouncedSearchFn.cancel();
      this.addDebugLog('DEBOUNCED_SEARCH_CLEARED', {
        reason: 'dependency changed, force recreate',
        timestamp: Date.now(),
      });
    }
    this.debouncedSearchFn = undefined;
    logger.info(
      'SearchHandler',
      'Debounced function cleared, will be recreated on next createDebouncedSearch call',
      {},
      'clearDebouncedSearch',
    );
  }

  /**
   * Fallback solution: Direct DOM manipulation
   */
  private fallbackDOMSync(loading: boolean): void {
    requestAnimationFrame(() => {
      const selectElements = document.querySelectorAll('.arco-select');
      selectElements.forEach((element) => {
        if (loading) {
          element.classList.add('arco-select-loading');
        } else {
          element.classList.remove('arco-select-loading');
        }

        const placeholder = element.querySelector('.arco-select-placeholder');
        if (placeholder) {
          placeholder.textContent = loading ? '搜索中...' : '请选择';
        }
      });
    });
  }

  destroy(): void {
    this.isDestroyed = true;

    // Cancel debounced function
    if (
      this.debouncedSearchFn &&
      typeof this.debouncedSearchFn.cancel === 'function'
    ) {
      this.debouncedSearchFn.cancel();
      this.addDebugLog('DEBOUNCED_SEARCH_CANCELLED', {
        reason: 'plugin destroy called',
        timestamp: Date.now(),
      });
    }

    this.context = null as any;
  }
}
