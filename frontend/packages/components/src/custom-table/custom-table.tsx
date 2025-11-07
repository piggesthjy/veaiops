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
 * CustomTable main component
 * Highly customizable table component based on a plugin architecture — modular refactored version
 *

 * @date 2025-12-19
 */

import { logger } from '@veaiops/utils';
import React, { forwardRef } from 'react';
import { CustomLoading, TableTitle } from './components';
import { createTableRenderer } from './components/core/renderers';
import type { TableRenderConfig } from './components/core/renderers/table-renderer.types';
import { CustomTableContext } from './context';
import {
  useAutoScrollYWithCalc,
  useCustomTable,
  useImperativeHandle as useCustomTableImperativeHandle,
  useCustomTableRenderers,
  useEnhancedTableContext,
  usePluginManager,
} from './hooks';
import { wrapWithPlugins } from './plugins';
import type { CustomTableActionType } from './types/api/action-type';
import type { BaseQuery, BaseRecord, ServiceRequestType } from './types/core';
import type { CustomTableProps, PluginContext } from './types/index';
import { devLog, useCustomTableAutoLogExport } from './utils/log-utils';
import { usePerformanceLogging } from './utils/performance-logger';
import { resetLogCollector } from './utils/reset-log-collector';
/**
 * CustomTable component implementation
 */
function CustomTableInner<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
  ServiceType extends ServiceRequestType = ServiceRequestType,
  FormatRecordType extends BaseRecord = RecordType,
>(
  props: CustomTableProps<RecordType, QueryType, ServiceType, FormatRecordType>,
  ref: React.Ref<CustomTableActionType<FormatRecordType, QueryType>>,
) {
  // 🔍 Debug: log props received by CustomTable (component entry)
  logger.debug({
    message: '[CustomTable] 组件接收到的 props',
    data: {
      hasDataSource: Boolean(props.dataSource),
      dataSourceType: typeof props.dataSource,
      dataSourceKeys: props.dataSource ? Object.keys(props.dataSource) : [],
      hasRequest: Boolean((props.dataSource as any)?.request),
      requestType: typeof (props.dataSource as any)?.request,
      ready: (props.dataSource as any)?.ready,
      manual: (props.dataSource as any)?.manual,
      isServerPagination: (props.dataSource as any)?.isServerPagination,
      propsKeys: Object.keys(props),
    },
    source: 'CustomTable',
    component: 'CustomTableInner',
  });
  // 🚨 Infinite loop detection: render count monitoring
  const renderCountRef = React.useRef(0);
  const lastRenderTimeRef = React.useRef(Date.now());
  const RENDER_WARNING_THRESHOLD = 10; // Warn if over 10 renders within 10 seconds
  const RENDER_ERROR_THRESHOLD = 30; // 30 renders triggers a hard circuit-break
  const RENDER_TIME_WINDOW = 10000; // 10-second window

  React.useEffect(() => {
    const now = Date.now();

    // Reset time window
    if (now - lastRenderTimeRef.current > RENDER_TIME_WINDOW) {
      renderCountRef.current = 0;
      lastRenderTimeRef.current = now;
    }

    renderCountRef.current++;

    // Warning check
    if (renderCountRef.current === RENDER_WARNING_THRESHOLD) {
      logger.warn({
        message: `[CustomTable] ⚠️ 频繁渲染警告！${RENDER_TIME_WINDOW / 1000}秒内渲染了${renderCountRef.current}次`,
        data: {
          title: props.title,
          renderCount: renderCountRef.current,
          timeWindow: `${RENDER_TIME_WINDOW / 1000}秒`,
        },
        source: 'CustomTable',
        component: 'RenderMonitor',
      });
    }

    // Circuit-break check
    if (renderCountRef.current > RENDER_ERROR_THRESHOLD) {
      logger.error({
        message: `[CustomTable] 🚨 死循环检测！${RENDER_TIME_WINDOW / 1000}秒内渲染了${renderCountRef.current}次，已超过阈值${RENDER_ERROR_THRESHOLD}`,
        data: {
          title: props.title,
          renderCount: renderCountRef.current,
          suggestion:
            '请检查：1) handleColumns/handleFilters是否稳定 2) customTableProps是否每次都是新对象 3) useQuerySync是否循环',
        },
        source: 'CustomTable',
        component: 'RenderMonitor',
      });
    }
  });

  // 🚀 New: auto log export (development only)
  const {
    exportLogs: _exportLogs,
    isExporting,
    clearLogs: _clearLogs,
  } = useCustomTableAutoLogExport({
    autoStart: process.env.NODE_ENV === 'development',
    exportOnUnload: process.env.NODE_ENV === 'development',
  });

  // Performance monitoring
  const performance = usePerformanceLogging('CustomTable');
  const renderStartTime = performance.startTimer();

  // Enable reset log collection in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      resetLogCollector.enable();
      devLog.lifecycle({
        component: 'CustomTable',
        event: '组件初始化完成',
        data: {
          componentId: 'CustomTableInner',
          logCollectionEnabled: true,
          isExporting,
        },
      });
    }
  }, [isExporting]);

  React.useEffect(() => {
    const duration = performance.endTimer(renderStartTime);
    const durationValue = typeof duration === 'number' ? duration : 0;
    devLog.performance({
      component: 'CustomTable',
      operation: '完整渲染周期',
      duration: durationValue,
      data: {
        componentId: 'CustomTableInner',
        hasPlugins: Boolean(pluginManager),
        pluginsReady,
      },
    });
  });

  // Phase 1: create base context (without enhancements)
  const baseContext = useCustomTable<
    RecordType,
    QueryType,
    ServiceType,
    FormatRecordType
  >(props);

  // Base context created - data integrity check
  devLog.log({
    component: 'CustomTable',
    message: 'Base context created:',
    data: {
      hasData: Boolean(baseContext.state?.formattedTableData),
      dataLength: baseContext.state?.formattedTableData?.length,
      loading: baseContext.state?.loading,
      total: baseContext.state?.tableTotal,
    },
  });

  // Phase 2: create plugin manager
  const { pluginManager, pluginsReady } = usePluginManager<
    RecordType,
    QueryType
  >(
    {
      features: props.features,
      plugins: props.plugins,
    },
    baseContext as any,
  );

  // 🚀 New: plugin manager creation logs
  React.useEffect(() => {
    if (pluginManager) {
      devLog.lifecycle({
        component: 'PluginManager',
        event: '插件管理器创建完成',
        data: {
          pluginsCount: pluginManager.getPlugins().length,
          features: props.features,
          pluginsReady,
        },
      });
    }
  }, [pluginManager, props.features, pluginsReady]);

  // Phase 3: apply plugin-based prop enhancements
  const context = useEnhancedTableContext(baseContext, pluginManager);

  // Auto-calculate scroll.y (supports sticky)
  // ✅ Add error handling and detailed logs
  let userTableProps: any;
  try {
    if (typeof props.tableProps === 'function') {
      const loadingState = Boolean(context.state?.loading);
      devLog.log({
        component: 'CustomTable',
        message: '调用 tableProps 函数',
        data: {
          loading: loadingState,
          hasTableProps: Boolean(props.tableProps),
        },
      });
      userTableProps = props.tableProps({ loading: loadingState });
      devLog.log({
        component: 'CustomTable',
        message: 'tableProps 函数调用成功',
        data: {
          userTablePropsType: typeof userTableProps,
          hasPagination: Boolean(userTableProps?.pagination),
          rowKey: userTableProps?.rowKey,
        },
      });
    } else {
      userTableProps = props.tableProps;
      devLog.log({
        component: 'CustomTable',
        message: '使用静态 tableProps',
        data: {
          hasPagination: Boolean(userTableProps?.pagination),
          rowKey: userTableProps?.rowKey,
        },
      });
    }
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({
      message: 'tableProps 调用失败',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
        tablePropsType: typeof props.tableProps,
      },
      source: 'CustomTable',
      component: 'tablePropsHandler',
    });
    // Use default values
    userTableProps = {};
  }

  // 🔧 Compatibility: support reading rowKey from tableProps
  // Priority: top-level rowKey prop > tableProps.rowKey > default 'Id'
  const finalRowKey = React.useMemo(() => {
    const propRowKey = props.rowKey || 'Id';

    // If an explicit rowKey (not default) is passed, use it
    if (propRowKey !== 'Id') {
      return propRowKey;
    }

    // Otherwise, try to extract rowKey from tableProps
    const tablePropsRowKey =
      userTableProps && typeof userTableProps === 'object'
        ? (userTableProps as Record<string, unknown>).rowKey
        : undefined;

    if (
      tablePropsRowKey &&
      (typeof tablePropsRowKey === 'string' ||
        typeof tablePropsRowKey === 'function')
    ) {
      return tablePropsRowKey;
    }

    return propRowKey;
  }, [props.rowKey, userTableProps]);

  const _autoScrollConfig = useAutoScrollYWithCalc(
    {
      offset: props.autoScrollY?.offset ?? 350, // Configurable offset
      enabled:
        props.autoScrollY?.enabled !== false &&
        props.stickyConfig?.enableHeaderSticky !== false, // Enabled by default
      minHeight: props.autoScrollY?.minHeight ?? 300,
      maxHeight: props.autoScrollY?.maxHeight,
    },
    userTableProps?.scroll,
  );

  // Enhanced context created - plugin enhancement check
  devLog.log({
    component: 'CustomTable',
    message: 'Enhanced context created:',
    data: {
      hasEnhancedData: Boolean(context.state?.formattedTableData),
      enhancedDataLength: (context.state?.formattedTableData as any[])?.length,
      enhancedLoading: context.state?.loading,
      enhancedTotal: context.state?.tableTotal,
      hasColumns: Boolean(context.props?.baseColumns),
      columnsCount: (context.props?.baseColumns as any[])?.length,
    },
  });

  // Phase 4: create renderer set (only when plugins are ready)
  // Use BaseRecord to avoid object constraint issues
  const {
    NoDataElement,
    TableFilterComponent,
    AlertComponent,
    renderTableContent,
    renderFooterContent,
  } = useCustomTableRenderers<BaseRecord, any>(
    context as any,
    pluginManager,
    props.dataSource as any,
    pluginsReady, // Pass plugin readiness status
  );

  // 🚀 New: renderer set creation logs
  React.useEffect(() => {
    if (pluginsReady) {
      devLog.lifecycle({
        component: 'Renderers',
        event: '渲染器集合创建完成',
        data: {
          hasNoDataElement: Boolean(NoDataElement),
          hasTableFilterComponent: Boolean(TableFilterComponent),
          hasAlertComponent: Boolean(AlertComponent),
          hasRenderTableContent: Boolean(renderTableContent),
          hasRenderFooterContent: Boolean(renderFooterContent),
        },
      });
    }
  }, [
    pluginsReady,
    NoDataElement,
    TableFilterComponent,
    AlertComponent,
    renderTableContent,
    renderFooterContent,
  ]);

  // Get data and state from context
  const {
    state: {
      formattedTableData,
      loading,
      tableTotal,
      current,
      pageSize,
      sorter,
      filters,
    },
    helpers: { setCurrent, setPageSize },
    props: {
      // Title-related config
      title,
      titleClassName,
      titleStyle,
      actions,

      // Table core config
      // rowKey compatibility handled earlier via finalRowKey
      pagination = {},
      tableClassName = '',
      baseColumns,

      // Loading-related config
      useCustomLoading = false,
      loadingTip = '加载中...',
      customLoading = false,
    },
  } = context;

  // 🎯 Build semantic table render config
  const tableRenderConfig: TableRenderConfig<RecordType> = {
    style: {
      className: tableClassName,
      rowKey: finalRowKey as string | ((record: RecordType) => React.Key),
    },
    columns: {
      baseColumns: baseColumns || [],
    },
    data: {
      formattedData: formattedTableData,
      total: tableTotal,
      emptyStateElement: NoDataElement,
    },
    pagination: {
      current,
      pageSize,
      config: pagination,
      onPageChange: setCurrent as (page: number) => void,
      onPageSizeChange: setPageSize as (size: number) => void,
    },
    loading: {
      isLoading: loading,
      useCustomLoader: useCustomLoading,
    },
  };

  // Table renderer — based on semantic config
  const tableComponent: React.ReactNode = createTableRenderer<
    RecordType,
    QueryType
  >(pluginManager, context, tableRenderConfig);

  // Use type-safe transformer to handle generic covariance
  const convertedContext = context as unknown as PluginContext<
    FormatRecordType,
    QueryType
  >;
  const safeFormattedData = formattedTableData as unknown as FormatRecordType[];

  // Expose instance API — using type-safe conversion
  useCustomTableImperativeHandle<FormatRecordType, QueryType>(
    ref,
    convertedContext,
    {
      formattedTableData: safeFormattedData,
      filters,
      sorter: sorter as any,
      current,
      pageSize,
      tableTotal,
    },
    pluginManager,
  );

  // 🚀 New: data state monitoring logs
  React.useEffect(() => {
    const dataLength = (formattedTableData as any[])?.length;
    devLog.info({
      component: 'DataState',
      message: '表格数据状态更新',
      data: {
        dataLength,
        loading,
        total: tableTotal,
        current,
        pageSize,
        hasSorter: Boolean(sorter),
        hasFilters: Boolean(
          filters && Object.keys(filters as Record<string, unknown>).length > 0,
        ),
        filtersCount: filters
          ? Object.keys(filters as Record<string, unknown>).length
          : 0,
      },
    });
  }, [
    formattedTableData,
    loading,
    tableTotal,
    current,
    pageSize,
    sorter,
    filters,
  ]);

  // 🚀 New: render performance monitoring
  const renderStart = React.useRef<number>();
  React.useEffect(() => {
    renderStart.current = Date.now();
    return () => {
      if (renderStart.current) {
        const duration = Date.now() - renderStart.current;
        devLog.performance({
          component: 'MainContent',
          operation: '主内容渲染',
          duration,
          data: {
            hasTitle: Boolean(title),
            hasActions: Boolean(actions),
            hasAlert: Boolean(AlertComponent),
          },
        });
      }
    };
  });

  // Main content — Alert should render here
  const mainContent = (
    <div className="flex-1 flex flex-col gap-2">
      <TableTitle
        title={title}
        actions={actions as React.ReactNode[]}
        className={titleClassName as string}
        titleStyle={titleStyle as React.CSSProperties}
        actionClassName={props.actionClassName as string}
      />

      {/* 🐛 Alert component should be here: below the title, above the filters */}
      {AlertComponent}

      {TableFilterComponent as any}

      {useCustomLoading && (loading || customLoading) && (
        <CustomLoading
          tip={typeof loadingTip === 'string' ? loadingTip : '加载中...'}
        />
      )}

      {renderTableContent(tableComponent)}

      {renderFooterContent()}
    </div>
  );

  // Final render validation - only log in development
  devLog.log({
    component: 'CustomTable',
    message: 'About to render:',
    data: {
      hasMainContent: Boolean(mainContent),
      hasContext: Boolean(context),
      contextDataLength: (context.state?.formattedTableData as any[])?.length,
      contextLoading: context.state?.loading,
      hasPluginManager: Boolean(pluginManager),
      pluginsReady,
    },
  });

  // If plugins aren't ready, show loading state
  if (!pluginsReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>正在初始化插件系统...</div>
      </div>
    );
  }

  // 🐛 Deep debug Context Provider (avoid logging circular refs)
  devLog.log({
    component: 'CustomTable',
    message: 'Context Provider调试',
    data: {
      // ✅ Log only safe information; avoid logging context with circular refs
      contextKeys: Object.keys(context || {}),
      hasContextProps: Boolean(context?.props),
      hasContextState: Boolean(context?.state),
      hasContextHelpers: Boolean(context?.helpers),
      contextStateKeys: context?.state ? Object.keys(context.state) : [],
      pluginManagerType: typeof pluginManager,
      mainContentType: typeof mainContent,
    },
  });

  // 🐛 Core fix: avoid context nesting issues; call wrapWithPlugins first, then provide Context
  // ✅ Add error handling and detailed logs
  let wrappedContent: React.ReactNode;
  try {
    devLog.log({
      component: 'CustomTable',
      message: '开始调用 wrapWithPlugins',
      data: {
        hasPluginManager: Boolean(pluginManager),
        hasMainContent: Boolean(mainContent),
        hasContext: Boolean(context),
        mainContentType: typeof mainContent,
        isValidMainContent: React.isValidElement(mainContent),
      },
    });

    wrappedContent = wrapWithPlugins<RecordType, QueryType>({
      pluginManager,
      content: mainContent,
      context,
    });

    devLog.log({
      component: 'CustomTable',
      message: 'wrapWithPlugins 调用成功',
      data: {
        wrappedContentType: typeof wrappedContent,
        isValidElement: React.isValidElement(wrappedContent),
        isNull: wrappedContent === null,
        isUndefined: wrappedContent === undefined,
      },
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({
      message: 'wrapWithPlugins 调用失败',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
        hasPluginManager: Boolean(pluginManager),
        hasMainContent: Boolean(mainContent),
        hasContext: Boolean(context),
      },
      source: 'CustomTable',
      component: 'wrapWithPlugins',
    });
    // Use original content as a fallback
    wrappedContent = mainContent;
  }

  // ✅ Add error handling for Context Provider rendering
  try {
    return (
      <div className="custom-table-wrapper">
        <CustomTableContext.Provider value={context as any}>
          {wrappedContent}
        </CustomTableContext.Provider>
      </div>
    );
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({
      message: 'CustomTable Context Provider 渲染失败',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
        hasContext: Boolean(context),
        hasWrappedContent: Boolean(wrappedContent),
        wrappedContentType: typeof wrappedContent,
      },
      source: 'CustomTable',
      component: 'ContextProvider',
    });
    // Fallback: return wrappedContent directly without Context Provider
    return <div className="custom-table-wrapper">{wrappedContent}</div>;
  }
}

const CustomTable = forwardRef(CustomTableInner) as <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
  ServiceType extends ServiceRequestType = ServiceRequestType,
  FormatRecordType extends BaseRecord = RecordType,
>(
  props: CustomTableProps<
    RecordType,
    QueryType,
    ServiceType,
    FormatRecordType
  > & {
    ref?: React.Ref<CustomTableActionType<FormatRecordType>>;
  },
) => React.ReactElement;

export { CustomTable };
