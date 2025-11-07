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

import type { ColumnProps } from '@arco-design/web-react/es/Table/interface';

import type {
  BaseQuery,
  BaseRecord,
  ColumnItem,
  CustomTablePluginProps,
  CustomTableProps,
  ModernTableColumnProps,
  PluginContext,
  ServiceRequestType,
} from '@/custom-table/types';
import type { CustomTableColumnProps } from '@/custom-table/types/components';
import { getParamsObject } from '@/custom-table/utils';
import { devLog } from '@/custom-table/utils/log-utils';
import { usePerformanceLogging } from '@/custom-table/utils/performance-logger';
import { logger } from '@veaiops/utils';
import { useDeepCompareEffect, useMount } from 'ahooks';
/**
 * CustomTable core Hook - integrates all plugin hooks (refactored version)
 * Split into multiple sub-modules with clear responsibilities based on modular architecture
 *
 * @date 2025-12-19
 */
import React, { useMemo } from 'react';
import { useTableHelpers, useTableState } from './internal/index';
import { useDataSource } from './use-data-source';
import { useQuerySync } from './use-query-sync';
import { useTableColumns } from './use-table-columns';

// Type-safe query type creation function
const createTypedQuery = <QueryType extends BaseQuery>(
  query: Partial<QueryType> | Record<string, unknown>,
): QueryType => query as QueryType;

/**
 * Type-safe column type conversion function
 * @description Used to convert column definitions between different record types
 * @param columns Source column definition array
 * @returns Converted column definition array
 *
 * @note This conversion is safe at runtime because:
 * 1. The basic structure of ColumnProps is the same under different generic parameters
 * 2. Only function type signatures like render, sorter are different
 * 3. In actual use, RecordType and FormatRecordType are usually compatible data structures
 */
const convertColumnsType = <
  FromType extends BaseRecord,
  ToType extends BaseRecord,
>(
  columns: ColumnProps<FromType>[],
): ColumnProps<ToType>[] =>
  // Use structured type assertion to ensure conversion clarity and traceability
  columns.map(
    (col) =>
      // Keep all column properties unchanged, only change generic type
      // This is safe at runtime because the actual function logic does not change
      ({
        ...col,
      }) as ColumnProps<ToType>,
  );

/**
 * @name CustomTable main Hook
 * @description Refactored based on modular architecture, integrates all functional sub-modules
 */
export const useCustomTable = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
  ServiceType extends ServiceRequestType = ServiceRequestType,
  FormatRecordType extends BaseRecord = RecordType,
>(
  props: CustomTableProps<RecordType, QueryType, ServiceType, FormatRecordType>,
): PluginContext<RecordType, QueryType> => {
  // Log useCustomTable execution start
  const hookInstanceId = React.useRef(
    `useCustomTable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  );

  // New: Hook mount logging
  React.useEffect(() => {
    const currentHookInstanceId = hookInstanceId.current;
    devLog.log({
      component: 'useCustomTable',
      message: '🎬 Hook mounted',
      data: {
        hookInstanceId: currentHookInstanceId,
        timestamp: new Date().toISOString(),
        initQuery: props.initQuery,
      },
    });

    return () => {
      devLog.log({
        component: 'useCustomTable',
        message: '🔚 Hook unmounted',
        data: {
          hookInstanceId: currentHookInstanceId,
        },
      });
    };
  }, [props.initQuery]);

  // 1. Table state management
  const tableState = useTableState<QueryType>(props as any);

  // Log table state initialization complete

  // Performance monitoring
  usePerformanceLogging('useCustomTable');

  devLog.render({
    component: 'useCustomTable',
    data: {
      propsKeys: Object.keys(props),
      timestamp: Date.now(),
    },
  });

  // Debug: record props before destructuring
  logger.debug({
    message: '[useCustomTable] Props before destructuring',
    data: {
      hasPropsDataSource: Boolean(props.dataSource),
      propsDataSourceType: typeof props.dataSource,
      propsDataSourceKeys: props.dataSource
        ? Object.keys(props.dataSource)
        : [],
      hasRequest: Boolean((props.dataSource as any)?.request),
      requestType: typeof (props.dataSource as any)?.request,
      propsKeys: Object.keys(props),
    },
    source: 'CustomTable',
    component: 'useCustomTable/props-before',
  });

  // Destructure core configuration parameters
  const {
    handleColumns,
    handleFilters,
    handleColumnsProps = {},
    handleFiltersProps = {},
    initQuery = {},
    initFilters = {},
    queryFormat = {},
    dataSource = { ready: true, manual: false },
    onQueryChange,
    pagination = {},
    syncQueryOnSearchParams = false,
    authQueryPrefixOnSearchParams = {},
    querySearchParamsFormat = {},
    useActiveKeyHook = false,
    customReset,
    sortFieldMap = {},
    supportSortColumns = true,
    isPaginationInCache = false,
    isFilterEffective = true,
    filterResetKeys = [],
    enableCustomFields = false,
    customFieldsProps,
    // Fix: Destructure AddAlert-related props
    isAlertShow,
    alertType,
    alertContent,
    customAlertNode,
    // New: Reset button enabled by default
    showReset = true,
  } = props;

  // Record initQuery after props destructuring
  logger.info({
    message: '[useCustomTable] Props destructuring completed - initQuery',
    data: {
      hookInstanceId: hookInstanceId.current,
      initQuery,
      initQueryKeys: Object.keys(initQuery),
      initQueryDatasourceType: (initQuery as Record<string, unknown>)
        .datasource_type,
      initQueryDatasourceTypeType: typeof (initQuery as Record<string, unknown>)
        .datasource_type,
      syncQueryOnSearchParams,
      useActiveKeyHook,
      windowLocationHref:
        typeof window !== 'undefined' ? window.location.href : 'N/A',
      windowLocationSearch:
        typeof window !== 'undefined' ? window.location.search : 'N/A',
      timestamp: new Date().toISOString(),
    },
    source: 'CustomTable',
    component: 'useCustomTable/props-after',
  });

  // Record data source configuration information
  const getDataSourceType = () => {
    if (dataSource?.request) {
      return 'request';
    }
    if (dataSource?.serviceInstance) {
      return 'service';
    }
    return 'unknown';
  };

  // Debug: record dataSource in props (record immediately after destructuring)
  logger.debug({
    message: '[useCustomTable] dataSource after props destructuring',
    data: {
      hasDataSource: Boolean(dataSource),
      dataSourceType: typeof dataSource,
      dataSourceKeys: dataSource ? Object.keys(dataSource) : [],
      hasRequest: Boolean((dataSource as any)?.request),
      requestType: typeof (dataSource as any)?.request,
      ready: (dataSource as any)?.ready,
      manual: (dataSource as any)?.manual,
      isServerPagination: (dataSource as any)?.isServerPagination,
      isDefaultValue: Boolean(
        dataSource &&
          (dataSource as any).ready === true &&
          (dataSource as any).manual === false &&
          !(dataSource as any).request &&
          !(dataSource as any).isServerPagination,
      ),
    },
    source: 'CustomTable',
    component: 'useCustomTable/props',
  });

  // 2. Handle column configuration
  // ✅ Add error handling and detailed logging
  const baseColumns = useMemo(() => {
    if (typeof handleColumns !== 'function') {
      devLog.warn({
        component: 'useCustomTable',
        message: 'handleColumns 不是函数，返回空列数组',
        data: {
          handleColumnsType: typeof handleColumns,
          handleColumnsValue: handleColumns,
        },
      });
      return [];
    }

    try {
      devLog.log({
        component: 'useCustomTable',
        message: '开始调用 handleColumns',
        data: {
          hasHandleColumnsProps: Boolean(handleColumnsProps),
          handleColumnsPropsKeys: Object.keys(handleColumnsProps || {}),
          query: tableState.query,
          queryKeys: Object.keys(tableState.query || {}),
        },
      });

      const columns = handleColumns({
        ...handleColumnsProps,
        query: tableState.query,
      });

      devLog.log({
        component: 'useCustomTable',
        message: 'handleColumns 调用成功',
        data: {
          columnsCount: Array.isArray(columns) ? columns.length : 0,
          columnsType: typeof columns,
          isArray: Array.isArray(columns),
        },
      });

      return columns;
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: 'handleColumns 调用失败',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
          handleColumnsType: typeof handleColumns,
          handleColumnsPropsKeys: Object.keys(handleColumnsProps || {}),
          query: tableState.query,
        },
        source: 'CustomTable',
        component: 'useCustomTable/handleColumns',
      });
      // Return empty array to avoid component crash
      return [];
    }
  }, [handleColumns, handleColumnsProps, tableState.query]);

  // Transform baseColumns to ensure type compatibility
  // ✅ Add error handling and detailed logging
  const compatibleBaseColumns = useMemo(() => {
    try {
      if (!Array.isArray(baseColumns)) {
        devLog.warn({
          component: 'useCustomTable',
          message: 'baseColumns 不是数组',
          data: {
            baseColumnsType: typeof baseColumns,
            baseColumnsValue: baseColumns,
          },
        });
        return [];
      }

      devLog.log({
        component: 'useCustomTable',
        message: '开始转换 baseColumns',
        data: {
          baseColumnsCount: baseColumns.length,
        },
      });

      const converted = baseColumns.map(
        (col: ModernTableColumnProps<FormatRecordType>, index: number) => {
          try {
            return {
              ...col,
              // Ensure key is string type, because ModernTableColumnProps key can be string | number | undefined
              key: col.key
                ? String(col.key)
                : col.dataIndex
                  ? String(col.dataIndex)
                  : `col-${index}-${Math.random()}`,
            };
          } catch (colError: unknown) {
            const colErrorObj =
              colError instanceof Error
                ? colError
                : new Error(String(colError));
            logger.error({
              message: `转换列配置失败 (索引 ${index})`,
              data: {
                error: colErrorObj.message,
                stack: colErrorObj.stack,
                errorObj: colErrorObj,
                col,
                index,
              },
              source: 'CustomTable',
              component: 'useCustomTable/convertColumn',
            });
            // Return a minimal column configuration to avoid crash
            return {
              key: `col-error-${index}`,
              title: `Column ${index}`,
              dataIndex: `col_${index}`,
            };
          }
        },
      ) as ColumnItem<FormatRecordType>[];

      devLog.log({
        component: 'useCustomTable',
        message: 'baseColumns 转换完成',
        data: {
          convertedCount: converted.length,
        },
      });

      return converted;
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: 'baseColumns 转换失败',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
          baseColumnsType: typeof baseColumns,
          isArray: Array.isArray(baseColumns),
          baseColumnsLength: Array.isArray(baseColumns)
            ? baseColumns.length
            : 0,
        },
        source: 'CustomTable',
        component: 'useCustomTable/convertBaseColumns',
      });
      // Return empty array to avoid component crash
      return [];
    }
  }, [baseColumns]);

  // 3. Type transformation: Transform ColumnItem to CustomTableColumnProps to meet useTableColumns type requirements
  const customTableColumns = useMemo(
    () =>
      compatibleBaseColumns.map((col) => ({
        ...col,
        title: col.title || '', // Ensure title exists
        dataIndex: col.dataIndex || col.key || '', // Ensure dataIndex exists
      })) as CustomTableColumnProps<FormatRecordType>[],
    [compatibleBaseColumns],
  );

  // 4. Use table column business management plugin
  const {
    columns: managedColumns,
    filters,
    query: columnQuery,
    setFilters,
  } = useTableColumns({
    baseColumns: customTableColumns,
    defaultFilters: { ...initFilters } as Record<string, (string | number)[]>,
  });

  // Record column configuration handling completed

  // 5. Merge query conditions
  const finalQuery = useMemo(() => {
    const merged = createTypedQuery<QueryType>({
      ...(tableState.query as Record<string, unknown>),
      ...columnQuery,
    });

    // Detailed logging: record finalQuery merge process
    logger.info({
      message: '[useCustomTable] 🔍 finalQuery 合并',
      data: {
        hookInstanceId: hookInstanceId.current,
        tableStateQuery: tableState.query,
        tableStateQueryKeys: Object.keys(tableState.query || {}),
        tableStateQueryDatasourceType: tableState.query?.datasource_type,
        tableStateQueryStringified: JSON.stringify(tableState.query),
        columnQuery,
        columnQueryKeys: Object.keys(columnQuery || {}),
        columnQueryDatasourceType: columnQuery?.datasource_type,
        columnQueryStringified: JSON.stringify(columnQuery),
        mergedQuery: merged,
        mergedQueryKeys: Object.keys(merged || {}),
        mergedQueryDatasourceType: merged?.datasource_type,
        mergedQueryDatasourceTypeType: typeof merged?.datasource_type,
        mergedQueryStringified: JSON.stringify(merged),
        windowLocationHref:
          typeof window !== 'undefined' ? window.location.href : 'N/A',
        windowLocationSearch:
          typeof window !== 'undefined' ? window.location.search : 'N/A',
        timestamp: new Date().toISOString(),
      },
      source: 'CustomTable',
      component: 'useCustomTable/finalQuery',
    });

    return merged;
  }, [tableState.query, columnQuery]);

  // New: listen to finalQuery changes
  React.useEffect(() => {
    devLog.log({
      component: 'useCustomTable',
      message: '🔍 FinalQuery变化',
      data: {
        hookInstanceId: hookInstanceId.current,
        finalQuery,
        tableStateQuery: tableState.query,
        columnQuery,
        timestamp: new Date().toISOString(),
      },
    });
  }, [finalQuery, columnQuery, tableState.query]);

  // 5. Query parameter synchronization configuration
  const querySyncConfig = useMemo(
    () => ({
      syncQueryOnSearchParams,
      authQueryPrefixOnSearchParams,
      querySearchParamsFormat,
      queryFormat,
      useActiveKeyHook,
      initQuery: props.initQuery, // 🔧 Pass initQuery to querySyncConfig
      customReset,
    }),
    [
      syncQueryOnSearchParams,
      authQueryPrefixOnSearchParams,
      querySearchParamsFormat,
      queryFormat,
      useActiveKeyHook,
      props.initQuery, // 🔧 Add initQuery to dependency array
      customReset,
    ],
  );

  // 6. Use query synchronization plugin
  const querySync = useQuerySync(querySyncConfig, {
    query: finalQuery,
    setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => {
      if (typeof query === 'function') {
        const newQuery = query(finalQuery);
        tableState.setQuery(newQuery);
      } else {
        tableState.setQuery(query);
      }
    },
    searchParams: new URLSearchParams(),
    setSearchParams: () => {
      /* empty */
    },
    isMounted: false,
    resetRef: { current: false },
    activeKeyChangeRef: { current: {} as Record<string, unknown> },
  });

  // 7. Use data source plugin
  // Debug: record dataSource props passed to useDataSource
  logger.debug({
    message: '[useCustomTable] 传递给 useDataSource 的 dataSource',
    data: {
      hasDataSource: Boolean(dataSource),
      dataSourceType: typeof dataSource,
      dataSourceKeys: dataSource ? Object.keys(dataSource) : [],
      hasRequest: Boolean((dataSource as any)?.request),
      requestType: typeof (dataSource as any)?.request,
      ready: (dataSource as any)?.ready,
      isServerPagination: (dataSource as any)?.isServerPagination,
    },
    source: 'CustomTable',
    component: 'useCustomTable',
  });

  const dataSourceHook = useDataSource({
    props: {
      dataSource,
      query: finalQuery,
      sorter: tableState.sorter,
      filters,
      current: tableState.current,
      pageSize: tableState.pageSize,
      isFilterEffective,
      onQueryChange,
      setQuery: tableState.setQuery,
      setSearchParams: tableState.setSearchParams,
      sortFieldMap,
      supportSortColumns,
    },
  });

  // 8. Create Helper methods
  const helpers = useTableHelpers({
    state: tableState,
    config: {
      initQuery,
      filterResetKeys,
      querySync,
      dataSourceMethods: {
        setLoading: dataSourceHook.setLoading,
        setError: dataSourceHook.setError,
        loadMoreData: dataSourceHook.loadMoreData,
      },
    },
    setFilters: setFilters as (
      filters: Record<string, (string | number)[]>,
    ) => void,
  });

  // 9. Build filter configuration
  // 🔧 Key fix: Use useRef to save latest value, avoid frequent recreation due to finalQuery dependency
  const finalQueryRef = React.useRef(finalQuery);
  const handleChangeRef = React.useRef(helpers.handleChange);

  // Always keep the latest value
  finalQueryRef.current = finalQuery;
  handleChangeRef.current = helpers.handleChange;

  const configs = useMemo(() => {
    const result =
      handleFilters?.({
        query: finalQueryRef.current,
        handleChange: handleChangeRef.current,
        handleFiltersProps,
      }) || [];

    devLog.log({
      component: 'useCustomTable',
      message: '📋 Configs生成',
      data: {
        hookInstanceId: hookInstanceId.current,
        configsLength: result.length,
        query: finalQueryRef.current,
        timestamp: new Date().toISOString(),
      },
    });

    return result;
  }, [handleFilters, handleFiltersProps]);
  // ✅ Only depend on handleFilters function itself and configuration, not on query and handleChange

  // 10. Side effect handling
  useDeepCompareEffect(() => {
    if (!syncQueryOnSearchParams) {
      const newSearchParams = getParamsObject({
        searchParams: tableState.searchParams,
        queryFormat,
      });
      tableState.setQuery(
        createTypedQuery<QueryType>({
          ...(tableState.query as Record<string, unknown>),
          ...newSearchParams,
        }),
      );
    }
  }, [syncQueryOnSearchParams ? null : tableState.searchParams]);

  // Record initQuery merge process
  // Fix: Only depend on initQuery, not on tableState (avoid loop)
  useDeepCompareEffect(() => {
    const currentQuery = tableState.query as Record<string, unknown>;
    const mergedQuery = createTypedQuery<QueryType>({
      ...currentQuery,
      ...initQuery,
    });

    // Only update when truly needed (avoid unnecessary updates causing loops)
    const currentQueryStr = JSON.stringify(currentQuery);
    const mergedQueryStr = JSON.stringify(mergedQuery);
    if (currentQueryStr === mergedQueryStr) {
      // Values are the same, no update needed
      return;
    }

    logger.info({
      message: '[useCustomTable] 🔄 initQuery 合并',
      data: {
        hookInstanceId: hookInstanceId.current,
        currentQueryKeys: Object.keys(currentQuery),
        currentQueryDatasourceType: (currentQuery as Record<string, unknown>)
          .datasource_type,
        initQueryKeys: Object.keys(initQuery),
        initQueryDatasourceType: (initQuery as Record<string, unknown>)
          .datasource_type,
        mergedQueryKeys: Object.keys(mergedQuery),
        mergedQueryDatasourceType: (mergedQuery as Record<string, unknown>)
          .datasource_type,
        willUpdate: true,
        timestamp: new Date().toISOString(),
      },
      source: 'CustomTable',
      component: 'useCustomTable/initQuery',
    });

    tableState.setQuery(mergedQuery);
    // Fix: Only depend on initQuery, remove tableState (avoid loop)
  }, [initQuery]);

  useDeepCompareEffect(() => {
    if (!isPaginationInCache) {
      tableState.setCurrent(1);
    }
    tableState.isQueryChangeRef.current = true;
    onQueryChange?.(finalQuery);
  }, [finalQuery, tableState.sorter, filters, isPaginationInCache]);

  // Trigger external loading callback (compatible with legacy onLoadingChange)
  useDeepCompareEffect(() => {
    props.onLoadingChange?.(dataSourceHook.loading || false);
  }, [dataSourceHook.loading]);

  // 11. Component mount handling
  useMount(() => {
    if (dataSource && 'onProcess' in dataSource) {
      const onProcess = (dataSource as any).onProcess as
        | ((handler: {
            run: () => void;
            stop: () => void;
            resetQuery: (params?: { resetEmptyData?: boolean }) => void;
          }) => void)
        | undefined;
      onProcess?.({
        run: () => {
          dataSourceHook.setResetEmptyData?.(false);
        },
        stop: () => {
          // Cancel logic handled internally by dataSourceHook
        },
        resetQuery: helpers.reset,
      });
    }
  });

  // 12. Build plugin context
  const {
    tableProps: propsTableProps,
    baseColumns: propsBaseColumns,
    ...restProps
  } = props;

  const pluginProps: CustomTablePluginProps<RecordType, QueryType> = {
    ...restProps,
    finalQuery,
    baseColumns:
      propsBaseColumns ||
      convertColumnsType<FormatRecordType, RecordType>(managedColumns),
    configs: Array.isArray(configs) ? {} : configs,
    tableProps: propsTableProps, // Ensure tableProps is passed to plugin context
    // 🔧 Explicitly pass important parameters to ensure they are not missed
    pagination,
    showReset,
    isAlertShow,
    alertType,
    alertContent,
    customAlertNode,
    // 🔧 Add other important configuration parameters
    sortFieldMap,
    supportSortColumns,
    isPaginationInCache,
    isFilterEffective,
    filterResetKeys,
    enableCustomFields,
    customFieldsProps,
  } as CustomTablePluginProps<RecordType, QueryType>;

  const pluginContext: PluginContext<RecordType, QueryType> = {
    props: pluginProps,
    state: {
      current: tableState.current,
      pageSize: tableState.pageSize,
      query: createTypedQuery<QueryType>(finalQuery),
      sorter: tableState.sorter,
      filters,
      formattedTableData: (dataSourceHook.data as RecordType[]) || [],
      loading: dataSourceHook.loading || false,
      tableTotal: dataSourceHook.tableTotal || 0,
      error: dataSourceHook.error || null,
      resetEmptyData: tableState.resetEmptyData,
      expandedRowKeys: tableState.expandedRowKeys,
      // expose CustomFields related state for plugins
      enableCustomFields: enableCustomFields || false,
      customFieldsProps,
      // expose baseColumns for plugins that need original columns
      baseColumns:
        (pluginProps.baseColumns as unknown as ColumnProps<RecordType>[]) || [],
    },
    helpers: {
      updateQuery: (newQuery: Partial<QueryType>) => {
        tableState.setQuery(
          (prev: QueryType) => ({ ...prev, ...newQuery }) as QueryType,
        );
      },
      ...helpers,
      // Type adaptation: adapt TableHelpers.handleChange to CustomTableHelpers.handleChange
      // TableHelpers.handleChange parameter types: HandleChangeSingleParams | HandleChangeObjectParams
      //   - HandleChangeSingleParams: { key: string; value?: unknown }
      //   - HandleChangeObjectParams: { updates: Record<string, unknown> }
      // CustomTableHelpers.handleChange parameter types: (keyOrObject, value?, handleFilter?, ctx?)
      // The two types are compatible at runtime, but TypeScript static type checking considers them incompatible
      // In actual use, type safety is guaranteed through function overloading and parameter checking
      // Why use this assertion: maintain backward compatibility, avoid large-scale refactoring
      handleChange: helpers.handleChange as unknown as (
        keyOrObject: string | Record<string, unknown>,
        value?: unknown,
        handleFilter?: () => Record<string, (string | number)[]>,
        ctx?: Record<string, unknown>,
      ) => void,
      run: helpers.loadMoreData, // Add alias for run method
      querySync,
      manualSyncQuery: () => querySync.syncQueryToUrl(finalQuery),
      resetQuery: querySync.resetQuery,
    },
  };

  // Debug logging: validate if Alert props are correctly passed
  devLog.log({
    component: 'useCustomTable',
    message: 'Alert Props passing debug',
    data: {
      // 1. Alert data in original props
      originalProps: {
        isAlertShow,
        alertType,
        alertContent: Boolean(alertContent),
        customAlertNode: Boolean(customAlertNode),
      },
      // 2. Alert data in pluginProps
      pluginPropsAlert: {
        isAlertShow: pluginProps.isAlertShow,
        alertType: pluginProps.alertType,
        alertContent: Boolean(pluginProps.alertContent),
        customAlertNode: Boolean(pluginProps.customAlertNode),
      },
      // 3. Check if restProps contains Alert data
      restPropsKeys: Object.keys(restProps),
      hasAlertInRestProps: 'isAlertShow' in restProps,
    },
  });

  // Hook result validation - development only
  if (process.env.NODE_ENV === 'development') {
    devLog.log({
      component: 'useCustomTable',
      message: 'Hook result:',
      data: {
        hasDataSource: Boolean(pluginContext.props.dataSource),
        dataLength: pluginContext.state.formattedTableData?.length,
        loading: pluginContext.state.loading,
        total: pluginContext.state.tableTotal,
        hasBaseColumns: Boolean(pluginContext.props.baseColumns),
        baseColumnsLength: pluginContext.props.baseColumns?.length,
        currentPage: pluginContext.state.current,
        pageSize: pluginContext.state.pageSize,
      },
    });
  }

  return pluginContext;
};
