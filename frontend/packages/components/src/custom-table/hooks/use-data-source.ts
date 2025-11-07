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

import { useRequest } from 'ahooks';
import { isEmpty, snakeCase } from 'lodash-es';
/**
 * 数据源插件核心 Hook
 * 从 plugins/data-source/hooks/use-data-source.ts 迁移而来
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildRequestResult,
  devLog,
  extractResponseData,
  filterEmptyDataByKeys,
  formatTableData,
  handleRequestError,
} from '@/custom-table';
// ✅ 优化：使用最短路径，合并同源导入
import { DEFAULT_DATA_SOURCE_CONFIG } from '@/custom-table/plugins/data-source/config';
import type { DataSourceConfig, TableDataSource } from '@/custom-table/types';
import { logger } from '@veaiops/utils';

/**
 * useDataSource Hook
 *
 * 为什么 props 使用 any：
 * - props 来自 CustomTable 组件，包含 dataSource、query、sorter、filters 等动态属性
 * - 不同表格的查询参数类型（QueryType）和记录类型（RecordType）都不同
 * - 使用泛型会导致调用处类型推导过于复杂
 * - props 在实际使用中通过解构获取具体字段，类型安全由具体字段的使用保证
 */
export interface UseDataSourceParams {
  props: Record<string, unknown>;
  config?: DataSourceConfig;
}

export const useDataSource = ({ props, config = {} }: UseDataSourceParams) => {
  const {
    dataSource: rawDataSource = {},
    query: rawQuery = {},
    sorter: rawSorter = {},
    filters: rawFilters = {},
    current: rawCurrent = 1,
    pageSize: rawPageSize = 10,
    isFilterEffective = true,
  } = props;

  // 调试：记录 rawDataSource 的状态
  logger.debug({
    message: '[useDataSource] Props解构完成',
    data: {
      hasRawDataSource: Boolean(rawDataSource),
      rawDataSourceType: typeof rawDataSource,
      rawDataSourceKeys: rawDataSource ? Object.keys(rawDataSource) : [],
      hasRequest: Boolean((rawDataSource as any)?.request),
      requestType: typeof (rawDataSource as any)?.request,
    },
    source: 'CustomTable',
    component: 'useDataSource',
  });

  // 类型断言：props 中的字段类型不确定，需要断言为具体类型
  const dataSource = rawDataSource as TableDataSource;
  const query = rawQuery as Record<string, unknown>;
  const sorter = rawSorter as {
    field?: string;
    direction?: 'ascend' | 'descend';
  };
  const filters = rawFilters as Record<string, unknown>;
  const current = rawCurrent as number;
  const pageSize = rawPageSize as number;

  const { enableClientFiltering = false } = {
    ...DEFAULT_DATA_SOURCE_CONFIG,
    ...config,
  };

  // 状态
  const [resetEmptyData, setResetEmptyData] = useState(false);
  // 手动控制的状态
  const [manualLoading, setManualLoading] = useState<boolean | null>(null);
  const [manualError, setManualError] = useState<Error | null>(null);

  // 构建刷新依赖 - 排除 dataSource.request 函数引用，避免死循环
  const refreshDeps = useMemo(() => {
    // 创建一个不包含函数引用的 dataSource 副本
    const stableDataSource = dataSource
      ? {
          ...dataSource,
          request: undefined, // 排除 request 函数引用
        }
      : dataSource;

    let deps: Array<unknown> = [filters, sorter, stableDataSource];
    if (isFilterEffective) {
      deps = [query, ...deps];
    }
    if (dataSource?.isServerPagination) {
      deps = [...deps, current, pageSize];
    }
    return deps;
  }, [
    filters,
    sorter,
    dataSource,
    dataSource?.isServerPagination,
    dataSource?.ready,
    dataSource?.manual,
    dataSource?.responseItemsKey,
    dataSource?.payload,
    isFilterEffective,
    query,
    current,
    pageSize,
  ]);

  // 生成请求ID用于日志追踪
  const generateRequestId = useCallback(() => {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }, []);

  // 🔍 调试：记录 dataSource 在 buildRequestParams 中的状态
  useEffect(() => {
    logger.debug({
      message: '[useDataSource] dataSource 状态（buildRequestParams 前）',
      data: {
        hasDataSource: Boolean(dataSource),
        dataSourceType: typeof dataSource,
        dataSourceKeys: dataSource ? Object.keys(dataSource) : [],
        hasRequest: Boolean(dataSource?.request),
        requestType: typeof dataSource?.request,
        ready: dataSource?.ready,
        manual: dataSource?.manual,
        isServerPagination: dataSource?.isServerPagination,
      },
      source: 'CustomTable',
      component: 'useDataSource/dataSource-state',
    });
  }, [dataSource]);

  // 构建请求参数的辅助函数
  const buildRequestParams = () => {
    // 构建分页参数 - 使用 skip/limit 格式
    const pageReq = dataSource?.isServerPagination
      ? {
          page_req: {
            skip: (current - 1) * pageSize,
            limit: pageSize,
          },
        }
      : {};

    const formatPageReq =
      (
        dataSource?.paginationConvert as
          | ((pageReq: Record<string, unknown>) => Record<string, unknown>)
          | undefined
      )?.(pageReq) || pageReq;

    // 构建排序参数 - 直接使用 sort_columns 格式
    // 检查 sorter 是否有 field 属性，而不是检查对象是否为空
    const sortColumnsReq = sorter?.field
      ? {
          sort_columns: [
            {
              column:
                (props.sortFieldMap as Record<string, string> | undefined)?.[
                  sorter.field
                ] || snakeCase(sorter.field),
              desc: sorter.direction === 'descend',
            },
          ],
        }
      : {};

    // 记录排序参数日志
    // 注意：将复杂对象参数提取为变量，避免 TypeScript 解析错误（TS1136）
    const sortLoggerMessage = '构建排序参数';
    const sortLoggerData = {
      sorter,
      sortColumnsReq,
      hasSorterField: Boolean(sorter?.field),
      sortFieldMap: props.sortFieldMap,
      sorterField: sorter?.field,
      sorterDirection: sorter?.direction,
      willIncludeSortColumns: Boolean(sortColumnsReq.sort_columns),
    };
    logger.info({
      message: sortLoggerMessage,
      data: sortLoggerData,
      source: 'CustomTable',
      component: 'useDataSource/buildRequestParams',
    });

    // 构建列筛选参数
    const emptyColumnReq = dataSource?.isEmptyColumnsFilter
      ? {
          emptyColumns:
            (
              props.formatFilterColumns as
                | ((
                    filters: Record<string, unknown>,
                  ) => Record<string, unknown>)
                | undefined
            )?.(filters) || filters,
        }
      : {};

    // 合并所有请求参数
    const payload = filterEmptyDataByKeys({
      ...query,
      ...filters,
      ...dataSource?.payload,
      ...sortColumnsReq,
      ...formatPageReq,
      ...emptyColumnReq,
    });

    const finalPayload =
      (
        dataSource?.formatPayload as
          | ((payload: Record<string, unknown>) => Record<string, unknown>)
          | undefined
      )?.(payload) || payload;
    // 记录最终请求参数日志
    logger.info({
      message: '最终请求参数',
      data: {
        payload,
        finalPayload,
        hasSortColumns: Boolean(finalPayload.sort_columns),
        sortColumns: finalPayload.sort_columns,
        hasQuery: Boolean(query && Object.keys(query).length > 0),
        hasFilters: Boolean(filters && Object.keys(filters).length > 0),
        hasPagination: Boolean(formatPageReq.page_req),
      },
      source: 'CustomTable',
      component: 'useDataSource/buildRequestParams',
    });

    return finalPayload;
  };

  // 发送API请求的辅助函数
  /**
   * 为什么 requestParams 使用 any：
   * - 请求参数类型由不同的 API 服务决定，无法预先确定
   * - 参数会传递给 dataSource.request 函数，该函数的类型由服务实例定义
   * - 使用 any 允许灵活的请求参数传递，类型安全由 API 服务层保证
   */
  const sendApiRequest = async (requestParams: Record<string, unknown>) => {
    // 🔍 调试：详细记录 dataSource 状态（sendApiRequest 入口）
    logger.debug({
      message: '[useDataSource] sendApiRequest 入口 - dataSource 状态',
      data: {
        hasDataSource: Boolean(dataSource),
        dataSourceType: typeof dataSource,
        dataSourceKeys: dataSource ? Object.keys(dataSource) : [],
        hasRequest: Boolean(dataSource?.request),
        requestType: typeof dataSource?.request,
        hasServiceInstance: Boolean(dataSource?.serviceInstance),
        serviceMethod: dataSource?.serviceMethod,
        ready: dataSource?.ready,
        manual: dataSource?.manual,
        isServerPagination: dataSource?.isServerPagination,
        requestParams,
      },
      source: 'CustomTable',
      component: 'sendApiRequest/entry',
    });

    // 🔍 详细记录API请求参数
    logger.info({
      message: '[useDataSource] ========== 发送API请求 ==========',
      data: {
        requestParams,
        requestParamsKeys: Object.keys(requestParams),
        requestParamsDatasourceType: requestParams.datasource_type,
        requestParamsDatasourceTypeType: typeof requestParams.datasource_type,
        hasSortColumns: Boolean(requestParams.sort_columns),
        sort_columns: requestParams.sort_columns,
        sortColumnsDetail: Array.isArray(requestParams.sort_columns)
          ? requestParams.sort_columns.map((sc) => ({
              column: sc.column,
              desc: sc.desc,
            }))
          : undefined,
        page_req: requestParams.page_req,
        windowLocationHref:
          typeof window !== 'undefined' ? window.location.href : 'N/A',
        windowLocationSearch:
          typeof window !== 'undefined' ? window.location.search : 'N/A',
        dataSource: {
          hasRequest: Boolean(dataSource.request),
          requestType: typeof dataSource.request,
          hasServiceInstance: Boolean(dataSource.serviceInstance),
          serviceMethod: dataSource.serviceMethod,
          ready: dataSource.ready,
          isServerPagination: dataSource.isServerPagination,
        },
      },
      source: 'CustomTable',
      component: 'sendApiRequest',
    });

    if (dataSource.request && typeof dataSource.request === 'function') {
      // 🔍 记录调用 request 函数前的状态
      logger.info({
        message: '[useDataSource] 准备调用 dataSource.request',
        data: {
          requestParams,
          requestParamsDatasourceType: requestParams.datasource_type,
          requestParamsDatasourceTypeType: typeof requestParams.datasource_type,
          requestParamsStringified: JSON.stringify(requestParams),
          timestamp: new Date().toISOString(),
        },
        source: 'CustomTable',
        component: 'sendApiRequest/beforeCall',
      });

      // 模式1: 直接使用request函数
      const response = await dataSource.request(requestParams);

      // 🔍 记录调用 request 函数后的响应
      logger.info({
        message: '[useDataSource] dataSource.request 调用完成',
        data: {
          requestParams,
          requestParamsDatasourceType: requestParams.datasource_type,
          responseDataLength:
            (response as { data?: unknown[] })?.data?.length || 0,
          responseTotal: (response as { total?: number })?.total || 0,
          timestamp: new Date().toISOString(),
        },
        source: 'CustomTable',
        component: 'sendApiRequest/afterCall',
      });

      return response;
    }

    if (dataSource.serviceInstance && dataSource.serviceMethod) {
      // 模式2: 使用serviceInstance[serviceMethod]
      // 为什么使用类型断言：

      // - serviceMethod 是动态的方法名，TypeScript 无法推断具体方法类型

      // - 需要通过类型断言确保调用安全，类型安全由运行时服务实例保证

      const serviceMethod = dataSource.serviceMethod as string;

      const serviceInstance = dataSource.serviceInstance as Record<
        string,
        (
          params: Record<string, unknown>,

          options?: { pluginConfig?: Record<string, unknown> },
        ) => Promise<unknown>
      >;

      return await serviceInstance[serviceMethod](requestParams, {
        pluginConfig: {
          ...(dataSource?.pluginConfig || {
            showNotice: {
              stage: 'fail',
            },
            title: '通知',
            content: '列表数据请求',
          }),
        },
      });
    }

    throw new Error(
      '数据源配置错误：必须提供 request 函数或 serviceInstance + serviceMethod',
    );
  };

  // 请求数据
  const { data, loading, error, run, cancel } = useRequest(
    async () => {
      const requestId = generateRequestId();

      // 🔍 记录请求开始日志
      logger.info({
        message: '[useDataSource] ========== useRequest 开始执行 ==========',
        data: {
          requestId,
          query,
          queryKeys: Object.keys(query || {}),
          queryDatasourceType: query?.datasource_type,
          queryDatasourceTypeType: typeof query?.datasource_type,
          filters,
          filtersKeys: Object.keys(filters || {}),
          current,
          pageSize,
          windowLocationHref:
            typeof window !== 'undefined' ? window.location.href : 'N/A',
          windowLocationSearch:
            typeof window !== 'undefined' ? window.location.search : 'N/A',
          timestamp: new Date().toISOString(),
        },
        source: 'CustomTable',
        component: 'useDataSource/useRequest',
      });

      try {
        // 如果请求被取消，提前返回
        if (dataSource?.isCancel) {
          logger.info({
            message: '[useDataSource] 请求被取消',
            data: { requestId },
            source: 'CustomTable',
            component: 'useDataSource/useRequest',
          });
          return { list: [], total: 0 };
        }

        const requestParams = buildRequestParams();

        // 🔍 记录 buildRequestParams 返回的参数
        logger.info({
          message: '[useDataSource] buildRequestParams 返回',
          data: {
            requestParams,
            requestParamsKeys: Object.keys(requestParams),
            requestParamsDatasourceType: requestParams.datasource_type,
            requestParamsDatasourceTypeType:
              typeof requestParams.datasource_type,
            timestamp: new Date().toISOString(),
          },
          source: 'CustomTable',
          component: 'useDataSource/useRequest',
        });

        const response = await sendApiRequest(requestParams);

        // 二次检查是否取消
        if (dataSource?.isCancel) {
          return { list: [], total: 0 };
        }

        const { newDataList, responseTotal } = extractResponseData(
          response,
          dataSource,
        );

        devLog.log({
          component: 'useDataSource',
          message: 'API Response extracted:',
          data: {
            response,
            newDataListLength: newDataList?.length,
            responseTotal,
          },
        });

        const result = buildRequestResult(
          response,
          newDataList,
          responseTotal,
          dataSource,
          current,
          props.setCurrent as (
            updater: number | ((prev: number) => number),
          ) => void,
          props.isQueryChange as boolean,
          query,
        );

        return result;
      } catch (error) {
        handleRequestError(error, requestId, dataSource);
        return { list: [], total: 0 };
      }
    },
    {
      debounceWait: 300,
      retryCount: 0, // 禁用自动重试，避免404等错误时的死循环
      refreshDeps,
      ready: dataSource.ready,
      manual: dataSource.manual,
      onError: (_error) => {
        // 记录useRequest层面的错误
      },
      onSuccess: (_result) => {
        // 记录请求成功日志
      },
    },
  );

  // 前端筛选表格数据
  const formattedTableData = (() => {
    if ((!data && !dataSource?.dataList) || resetEmptyData) {
      return [];
    }

    let newFilterData = [];

    if (!isEmpty(dataSource?.dataList)) {
      // 为什么使用类型断言和类型转换：
      // - dataSource.dataList 可能是任意类型的数据数组
      // - formatTableData 是泛型函数，需要明确的类型参数
      // - 这些数据会在 formatTableData 内部进行类型安全转换
      const formatDataList = formatTableData<unknown, unknown>({
        sourceData: (dataSource?.dataList as unknown[]) || [],
        addRowKey: Boolean(dataSource?.addRowKey),
        arrayFields: (dataSource?.arrayFields as string[]) || [],
        formatDataConfig:
          (dataSource?.formatDataConfig as Record<string, unknown>) || {},
      });
      newFilterData = Array.isArray(formatDataList) ? formatDataList : [];
    } else {
      newFilterData = Array.isArray(data?.list) ? data.list : [];
    }

    const isFilterEmpty = isEmpty(filterEmptyDataByKeys(filters));
    const querySearchKey = dataSource?.querySearchKey;
    const search = querySearchKey
      ? (query[querySearchKey] as string | undefined)
      : undefined;

    // 客户端关键词搜索
    if (search && !isEmpty(dataSource?.querySearchMatchKeys)) {
      const keyword = String(search).toLowerCase();

      // 使用 unknown 类型，因为数据项类型由 dataSource 配置决定
      newFilterData = newFilterData.filter((item: unknown) => {
        const itemObj = item as Record<string, unknown>;
        return (
          dataSource?.querySearchMatchKeys?.some((key: string) =>
            String(itemObj?.[key]).toLowerCase().includes(keyword),
          ) ?? false
        );
      });
    }

    // 客户端过滤
    if (
      enableClientFiltering &&
      !isFilterEmpty &&
      !dataSource?.isServerPagination
    ) {
      newFilterData =
        (
          props.filterTableData as
            | ((data: unknown[], filters: Record<string, unknown>) => unknown[])
            | undefined
        )?.(newFilterData, filters) || newFilterData;
    }

    return newFilterData;
  })();

  // 计算表格总数
  const tableTotal = (() => {
    const result =
      data?.total && dataSource?.isServerPagination
        ? data.total
        : formattedTableData?.length || 0;

    devLog.log({
      component: 'useDataSource',
      message: 'tableTotal calculation:',
      data: {
        'data?.total': data?.total,
        isServerPagination: dataSource?.isServerPagination,
        'formattedTableData?.length': formattedTableData?.length,
        result,
        'data structure': Object.keys(data || {}),
      },
    });

    return result;
  })();

  // 加载更多数据
  const loadMoreData = useCallback(() => {
    run();
  }, [run]);

  // 监控排序状态变化
  useEffect(() => {
    logger.log({
      message: '排序状态变化监听触发',
      data: {
        sorter,
        sorterKeys: Object.keys(sorter),
        hasField: Boolean(sorter?.field),
        field: sorter?.field,
        direction: sorter?.direction,
        sorterType: typeof sorter,
        sorterIsEmpty: Object.keys(sorter || {}).length === 0,
      },
      source: 'CustomTable',
      component: 'useDataSource/sorterChange',
    });
  }, [sorter]);

  // 设置处理函数
  useEffect(() => {
    dataSource?.onProcess?.({
      run: () => {
        run?.();
        setResetEmptyData(false);
      },
      stop: cancel,
      resetQuery: ({ resetEmptyData: newResetEmptyData = false } = {}) => {
        (props.setQuery as (query: Record<string, unknown>) => void)({});
        (
          props.setSearchParams as
            | ((params: Record<string, unknown>) => void)
            | undefined
        )?.({});
        setResetEmptyData(newResetEmptyData);
      },
    });
  }, [dataSource, run, cancel, props.setQuery, props.setSearchParams]);

  // 手动控制loading和error的方法
  const setLoading = useCallback((loading: boolean) => {
    setManualLoading(loading);
  }, []);

  const setError = useCallback((error: Error | null) => {
    setManualError(error);
  }, []);

  // 实际的loading和error状态：手动状态优先，否则使用请求状态
  const finalLoading = manualLoading !== null ? manualLoading : loading;
  const finalError = manualError !== null ? manualError : error;

  return {
    data: formattedTableData,
    loading: finalLoading,
    error: finalError,
    tableTotal,
    resetEmptyData,
    setResetEmptyData,
    loadMoreData,
    // 新增手动控制方法
    setLoading,
    setError,
  };
};
