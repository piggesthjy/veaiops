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

import { API_RESPONSE_CODE } from '@veaiops/constants';
import { logger } from './logger/core';

/**
 * Custom Table 相关工具函数
 */

/**
 * Custom Table 分页参数接口
 */
export interface CustomTablePageReq {
  skip: number; // 跳过的记录数
  limit: number; // 限制返回的记录数
}

/**
 * Custom Table 请求参数接口
 *
 * @template Q - 查询参数类型，表示除分页参数外的其他查询条件（如 name、channel、status 等）
 *
 * 为什么使用泛型而不是 unknown：
 * - 泛型可以提供更好的类型推断，在使用时可以自动推导出查询参数的具体类型
 * - 业务代码传入具体的 QueryType 时，可以享受到完整的类型安全和 IDE 自动补全
 * - 默认使用 Record<string, unknown> 作为兜底，保证兼容性
 *
 * @example
 * ```typescript
 * // 定义具体的查询参数类型
 * interface BotQuery {
 *   name?: string;
 *   channel?: ChannelType;
 * }
 *
 * // 使用时类型会被推断为 BotQuery
 * const params: CustomTableParams<BotQuery> = {
 *   page_req: { skip: 0, limit: 10 },
 *   name: 'test',
 *   channel: 'lark',
 * };
 * ```
 */
export type CustomTableParams<
  Q extends Record<string, unknown> = Record<string, unknown>,
> = {
  page_req?: CustomTablePageReq;
} & Q;

/**
 * API 分页参数接口
 */
export interface ApiPaginationParams {
  skip: number; // 跳过的记录数
  limit: number; // 限制返回的记录数
}

/**
 * 将 Custom Table 的分页参数转换为 API 分页参数
 *
 * @param params - 参数对象
 * @param params.page_req - Custom Table 分页参数
 * @param params.defaultLimit - 默认限制数量，默认为 10
 * @returns API 分页参数
 *
 * @example
 * ```typescript
 * const page_req = { skip: 20, limit: 20 };
 * const apiParams = convertTablePaginationToApi({ page_req });
 * // 结果: { skip: 20, limit: 20 }
 * ```
 */
export interface ConvertTablePaginationToApiParams {
  page_req?: CustomTablePageReq;
  defaultLimit?: number;
}

export function convertTablePaginationToApi({
  page_req,
  defaultLimit = 10,
}: ConvertTablePaginationToApiParams): ApiPaginationParams {
  if (!page_req) {
    return {
      skip: 0,
      limit: defaultLimit,
    };
  }

  const { skip = 0, limit = defaultLimit } = page_req;

  return {
    skip,
    limit,
  };
}

/**
 * 从 Custom Table 参数中提取分页和其他参数
 *
 * @template Q - 查询参数类型，会从 CustomTableParams<Q> 中自动推断
 * @param params - 提取参数
 * @param params.params - Custom Table 请求参数
 * @param params.defaultLimit - 默认限制数量，默认为 10
 * @returns 包含分页参数和其他参数的对象，otherParams 的类型会被推断为 Q
 *
 * @example
 * ```typescript
 * // 定义查询参数类型
 * interface BotQuery {
 *   name?: string;
 *   channel?: ChannelType;
 * }
 *
 * const params: CustomTableParams<BotQuery> = {
 *   page_req: { skip: 20, limit: 20 },
 *   name: 'test',
 *   channel: 'lark',
 * };
 *
 * const { pagination, otherParams } = extractTableParams({ params });
 * // pagination: { skip: 20, limit: 20 }
 * // otherParams: BotQuery - 类型会被自动推断
 * ```
 */
export interface ExtractTableParamsParams<
  Q extends Record<string, unknown> = Record<string, unknown>,
> {
  params: CustomTableParams<Q>;
  defaultLimit?: number;
}

export function extractTableParams<
  Q extends Record<string, unknown> = Record<string, unknown>,
>({
  params,
  defaultLimit = 10,
}: ExtractTableParamsParams<Q>): {
  pagination: ApiPaginationParams;
  /**
   * 其他参数（除了 page_req 之外的所有参数）
   * 类型会被推断为 Q，提供完整的类型安全
   */
  otherParams: Q;
} {
  const { page_req, ...rest } = params;
  const pagination = convertTablePaginationToApi({ page_req, defaultLimit });

  // 类型断言：rest 的类型就是 Q，因为 CustomTableParams<Q> = { page_req?: CustomTablePageReq } & Q
  // 解构后排除 page_req 的剩余属性就是 Q
  const otherParams = rest as Q;

  return {
    pagination,
    otherParams,
  };
}

/**
 * CustomTable 排序列项接口
 * 对应 CustomTable use-data-source 构建的 sort_columns 格式
 */
export interface TableSortColumn {
  column: string; // 字段名（snake_case）
  desc: boolean; // true=降序, false=升序
}

/**
 * 将 CustomTable 的排序参数转换为 API 排序参数
 *
 * CustomTable 传递格式: sort_columns: [{ column: "created_at", desc: false }]
 * API 需要的格式: sortOrder: 'asc' | 'desc'
 *
 * @param params - 参数对象
 * @param params.sortColumns - CustomTable 的 sort_columns 参数
 * @param params.allowedFields - 允许排序的字段列表（可选）。如果提供，只有在列表中的字段才会被处理
 * @returns API 排序参数 ('asc' | 'desc' | undefined)
 *
 * @example
 * ```typescript
 * // 基本用法
 * const sortOrder = convertTableSortToApi({ sortColumns: params.sort_columns });
 * // sortOrder: 'asc' | 'desc' | undefined
 *
 * // 限制只允许 created_at 字段排序
 * const sortOrder = convertTableSortToApi({ sortColumns: params.sort_columns, allowedFields: ['created_at'] });
 *
 * // 在 API 请求中使用
 * const apiParams = {
 *   skip: 0,
 *   limit: 10,
 *   sortOrder: convertTableSortToApi({ sortColumns: params.sort_columns, allowedFields: ['created_at'] }),
 * };
 * ```
 */
export interface ConvertTableSortToApiParams {
  sortColumns: unknown;
  allowedFields?: string[];
}

export function convertTableSortToApi({
  sortColumns,
  allowedFields,
}: ConvertTableSortToApiParams): 'asc' | 'desc' | undefined {
  // 验证 sort_columns 是否为有效数组
  if (!Array.isArray(sortColumns) || sortColumns.length === 0) {
    return undefined;
  }

  const firstSortColumn = sortColumns[0];

  // 验证 sort_columns 结构
  if (
    !firstSortColumn ||
    typeof firstSortColumn !== 'object' ||
    !('column' in firstSortColumn) ||
    !('desc' in firstSortColumn) ||
    typeof firstSortColumn.column !== 'string' ||
    typeof firstSortColumn.desc !== 'boolean'
  ) {
    return undefined;
  }

  const typedColumn = firstSortColumn as TableSortColumn;

  // 如果指定了允许的字段列表，验证字段是否在列表中
  if (allowedFields && allowedFields.length > 0) {
    if (!allowedFields.includes(typedColumn.column)) {
      return undefined;
    }
  }

  // 转换规则：desc: false -> 'asc'（升序），desc: true -> 'desc'（降序）
  return typedColumn.desc ? 'desc' : 'asc';
}

/**
 * 创建 Custom Table 的 request 函数包装器
 *
 * @template T - API 响应类型
 * @template Q - 查询参数类型，用于推断 CustomTableParams<Q> 和其他参数类型
 * @param params - 参数对象
 * @param params.apiCall - 实际的 API 调用函数，接收分页参数和查询参数
 * @param params.defaultLimit - 默认限制数量，默认为 10
 * @returns 包装后的 request 函数，接收 CustomTableParams<Q> 参数
 *
 * @example
 * ```typescript
 * // 定义查询参数类型
 * interface BotQuery {
 *   name?: string;
 *   channel?: ChannelType;
 * }
 *
 * // 定义响应类型
 * interface BotListResponse {
 *   data: Bot[];
 *   total: number;
 * }
 *
 * const request = createTableRequestWrapper<BotListResponse, BotQuery>({
 *   apiCall: async ({ skip, limit, name, channel }) => {
 *     // name 和 channel 的类型会被正确推断为 BotQuery 中的类型
 *     return await apiClient.bots.getApisV1ManagerSystemConfigBots({
 *       skip, limit, name, channel
 *     });
 *   }
 * });
 *
 * // 在 dataSource 中使用
 * const dataSource = {
 *   request,
 *   ready: true,
 *   isServerPagination: true,
 * };
 * ```
 */
export interface CreateTableRequestWrapperParams<
  T = unknown,
  Q extends Record<string, unknown> = Record<string, unknown>,
> {
  apiCall: (params: ApiPaginationParams & Q) => Promise<T>;
  defaultLimit?: number;
}

export function createTableRequestWrapper<
  T = unknown,
  Q extends Record<string, unknown> = Record<string, unknown>,
>({ apiCall, defaultLimit = 10 }: CreateTableRequestWrapperParams<T, Q>) {
  return async (params: CustomTableParams<Q>): Promise<T> => {
    const { pagination, otherParams } = extractTableParams({
      params,
      defaultLimit,
    });

    return await apiCall({
      ...pagination,
      ...otherParams,
    });
  };
}

/**
 * 标准 API 响应接口
 * 对应后端返回的标准响应格式
 */
export interface StandardApiResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
  total?: number;
  [key: string]: unknown;
}

/**
 * 兼容类型：支持 code 为可选的分页响应
 * 用于处理 PaginatedAPIResponse 等类型
 */
export interface PaginatedApiResponse<T = unknown> {
  code?: number;
  message?: string;
  data?: T;
  total?: number;
  [key: string]: unknown;
}

/**
 * 表格数据响应接口
 * CustomTable 需要的响应格式
 */
export interface TableDataResponse<T = unknown> {
  data: T[];
  total: number;
  success: boolean;
}

/**
 * 处理 API 响应的配置选项
 */
export interface HandleApiResponseOptions {
  /**
   * 错误消息前缀，默认为空
   */
  errorMessagePrefix?: string;
  /**
   * 默认错误消息，当无法提取错误信息时使用
   */
  defaultErrorMessage?: string;
  /**
   * 是否显示错误消息，默认为 true
   */
  showErrorMessage?: boolean;
  /**
   * 数据转换函数，将 API 响应的 data 转换为表格需要的格式
   */
  transformData?: <T>(data: unknown) => T[];
  /**
   * 提取 total 的函数，如果 API 响应中没有 total 字段，可以使用此函数计算
   */
  extractTotal?: (
    response: StandardApiResponse | PaginatedApiResponse,
  ) => number;
  /**
   * 自定义错误处理函数
   */
  onError?: (
    error: unknown,
    response?: StandardApiResponse | PaginatedApiResponse,
  ) => void;
}

/**
 * 处理标准 API 响应，转换为表格数据格式
 *
 * @param params - 处理参数
 * @param params.response - API 响应
 * @param params.options - 处理选项
 * @returns 表格数据响应
 *
 * @example
 * ```typescript
 * // 基本用法
 * const tableResponse = handleApiResponse({ response });
 * // 结果: { data: [...], total: 100, success: true }
 *
 * // 带数据转换
 * const tableResponse = handleApiResponse({
 *   response,
 *   options: {
 *     transformData: (data) => (Array.isArray(data) ? data : [])
 *   }
 * });
 *
 * // 自定义错误处理
 * const tableResponse = handleApiResponse({
 *   response,
 *   options: {
 *     onError: (error) => {
 *       logger.error({ message: '自定义错误处理', data: { error }, source: 'Module', component: 'method' });
 *     }
 *   }
 * });
 * ```
 */
export interface HandleApiResponseParams<T = unknown> {
  response: StandardApiResponse<T> | PaginatedApiResponse<T>;
  options?: HandleApiResponseOptions;
}

export function handleApiResponse<T = unknown>({
  response,
  options = {},
}: HandleApiResponseParams<T>): TableDataResponse<T> {
  const {
    errorMessagePrefix = '',
    defaultErrorMessage = '获取数据失败，请重试',
    showErrorMessage = true,
    transformData,
    extractTotal,
    onError,
  } = options;

  // 检查响应是否成功（兼容 code 可选的情况）
  const responseCode = response.code ?? API_RESPONSE_CODE.SUCCESS;
  if (
    responseCode === API_RESPONSE_CODE.SUCCESS &&
    response.data !== undefined
  ) {
    // 处理数据
    let dataArray: T[] = [];
    if (transformData) {
      dataArray = transformData<T>(response.data);
    } else if (Array.isArray(response.data)) {
      dataArray = response.data as T[];
    } else {
      // 如果 data 不是数组，转换为数组
      dataArray = [response.data as T];
    }

    // 提取总数
    let total = 0;
    if (extractTotal) {
      total = extractTotal(response);
    } else {
      const { total: responseTotal } = response;
      if (typeof responseTotal === 'number' && responseTotal >= 0) {
        total = responseTotal;
      } else {
        // 如果没有 total 字段，使用数据长度
        total = dataArray.length;
      }
    }

    return {
      data: dataArray,
      total,
      success: true,
    };
  }

  // 处理错误响应
  const errorMessage = response.message || defaultErrorMessage;
  const fullErrorMessage = errorMessagePrefix
    ? `${errorMessagePrefix}: ${errorMessage}`
    : errorMessage;

  // ✅ 使用 logger 记录错误（不直接使用 Message，避免在 utils 包中依赖 UI 库）
  if (showErrorMessage) {
    logger.error({
      message: fullErrorMessage,
      data: { response, errorMessage, errorMessagePrefix },
      source: 'TableUtils',
      component: 'handleApiResponse',
    });
  }

  if (onError) {
    onError(new Error(errorMessage), response);
  }

  return {
    data: [],
    total: 0,
    success: false,
  };
}

/**
 * 创建带错误处理的表格请求函数包装器
 *
 * 该函数自动处理：
 * - 分页参数转换（page_req -> skip/limit）
 * - API 响应格式转换（StandardApiResponse -> TableDataResponse）
 * - 错误处理和消息提示
 *
 * @template T - API 响应数据类型
 * @template Q - 查询参数类型，用于推断 CustomTableParams<Q> 和其他参数类型
 * @param params - 参数对象
 * @param params.apiCall - 实际的 API 调用函数，接收分页参数和查询参数，返回 StandardApiResponse
 * @param params.options - 配置选项
 * @returns 包装后的 request 函数，接收 CustomTableParams<Q> 参数，返回 TableDataResponse
 *
 * @example
 * ```typescript
 * // 定义查询参数类型
 * interface BotQuery {
 *   name?: string;
 *   channel?: ChannelType;
 * }
 *
 * // 定义响应数据类型
 * interface Bot {
 *   _id: string;
 *   name: string;
 *   channel: ChannelType;
 * }
 *
 * // 使用泛型参数
 * const request = createTableRequestWithResponseHandler<Bot, BotQuery>({
 *   apiCall: async ({ skip, limit, name, channel }) => {
 *     // name 和 channel 的类型会被正确推断为 BotQuery 中的类型
 *     return await apiClient.bots.getApisV1ManagerSystemConfigBots({
 *       skip, limit, name, channel
 *     });
 *   },
 *   options: {
 *     errorMessagePrefix: '获取机器人列表失败'
 *   }
 * });
 *
 * // 在 dataSource 中使用
 * const dataSource = {
 *   request,
 *   ready: true,
 *   isServerPagination: true,
 * };
 * ```
 */
export interface CreateTableRequestWithResponseHandlerParams<
  T = unknown,
  Q extends Record<string, unknown> = Record<string, unknown>,
> {
  apiCall: (
    params: ApiPaginationParams & Q,
  ) => Promise<StandardApiResponse<T> | PaginatedApiResponse<T>>;
  options?: HandleApiResponseOptions & { defaultLimit?: number };
}

export function createTableRequestWithResponseHandler<
  T = unknown,
  Q extends Record<string, unknown> = Record<string, unknown>,
>({
  apiCall,
  options = {},
}: CreateTableRequestWithResponseHandlerParams<T, Q>): (
  params: CustomTableParams<Q>,
) => Promise<TableDataResponse<T>> {
  const { defaultLimit = 10, ...responseOptions } = options;

  return async (
    params: CustomTableParams<Q>,
  ): Promise<TableDataResponse<T>> => {
    try {
      // 提取分页和其他参数
      const { pagination, otherParams } = extractTableParams({
        params,
        defaultLimit,
      });

      // 调用 API
      const apiResponse = await apiCall({
        ...pagination,
        ...otherParams,
      });

      // 处理响应（支持 StandardApiResponse 和 PaginatedApiResponse）
      // handleApiResponse 函数内部会处理类型兼容性，确保 code 被正确转换为 number
      return handleApiResponse<T>({
        response: apiResponse,
        options: responseOptions,
      });
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage =
        errorObj.message ||
        options.defaultErrorMessage ||
        '获取数据失败，请重试';

      // ✅ 使用 logger 记录错误（不直接使用 Message，避免在 utils 包中依赖 UI 库）
      // 注意：如果需要显示用户友好的错误提示，应在调用方使用 onError 回调处理
      if (options.showErrorMessage !== false) {
        const fullErrorMessage = options.errorMessagePrefix
          ? `${options.errorMessagePrefix}: ${errorMessage}`
          : errorMessage;
        logger.error({
          message: fullErrorMessage,
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
            params,
          },
          source: 'TableUtils',
          component: 'createTableRequestWithResponseHandler',
        });
      }

      // 自定义错误处理
      if (options.onError) {
        options.onError(error);
      }

      return {
        data: [],
        total: 0,
        success: false,
      };
    }
  };
}

/**
 * 标准表格数据源配置
 *
 * @template Q - 查询参数类型，用于推断 CustomTableParams<Q>
 */
export interface StandardTableDataSource<
  Q extends Record<string, unknown> = Record<string, unknown>,
> {
  request?: (params: CustomTableParams<Q>) => Promise<TableDataResponse>;
  ready: boolean;
  isServerPagination?: boolean;
  dataList?: unknown[];
  manual?: boolean;
}

/**
 * 创建标准服务器端分页数据源配置
 *
 * @template Q - 查询参数类型，用于推断 CustomTableParams<Q>
 * @param params - 参数对象
 * @param params.request - 请求函数，接收 CustomTableParams<Q> 参数
 * @param params.ready - 是否准备就绪，默认为 true
 * @returns 数据源配置对象
 *
 * @example
 * ```typescript
 * // 定义查询参数类型
 * interface BotQuery {
 *   name?: string;
 *   channel?: ChannelType;
 * }
 *
 * const request = (params: CustomTableParams<BotQuery>) => {
 *   // 实现请求逻辑
 * };
 * const dataSource = createServerPaginationDataSource<BotQuery>({ request });
 * // 结果: { request, ready: true, isServerPagination: true }
 * ```
 */
export interface CreateServerPaginationDataSourceParams<
  Q extends Record<string, unknown> = Record<string, unknown>,
> {
  request: (params: CustomTableParams<Q>) => Promise<TableDataResponse>;
  ready?: boolean;
}

export function createServerPaginationDataSource<
  Q extends Record<string, unknown> = Record<string, unknown>,
>({
  request,
  ready = true,
}: CreateServerPaginationDataSourceParams<Q>): StandardTableDataSource<Q> {
  // 调试：验证 request 参数
  logger.debug({
    message: '[createServerPaginationDataSource] 创建数据源',
    data: {
      hasRequest: Boolean(request),
      requestType: typeof request,
      ready,
    },
    source: 'TableUtils',
    component: 'createServerPaginationDataSource',
  });

  const dataSource = {
    request,
    ready,
    isServerPagination: true,
  };

  // 验证返回的对象
  logger.debug({
    message: '[createServerPaginationDataSource] 返回数据源',
    data: {
      hasRequest: Boolean(dataSource.request),
      requestType: typeof dataSource.request,
      ready: dataSource.ready,
      isServerPagination: dataSource.isServerPagination,
    },
    source: 'TableUtils',
    component: 'createServerPaginationDataSource',
  });

  return dataSource;
}

/**
 * 创建本地数据源配置
 *
 * @param params - 参数对象
 * @param params.dataList - 数据列表
 * @param params.ready - 是否准备就绪，默认为 true
 * @returns 数据源配置对象
 *
 * @example
 * ```typescript
 * const dataSource = createLocalDataSource({ dataList: [{ id: 1, name: 'test' }] });
 * // 结果: { dataList: [...], manual: true, ready: true }
 * ```
 */
export interface CreateLocalDataSourceParams {
  dataList: unknown[];
  ready?: boolean;
}

export function createLocalDataSource({
  dataList,
  ready = true,
}: CreateLocalDataSourceParams): StandardTableDataSource<
  Record<string, unknown>
> {
  return {
    dataList,
    manual: true,
    ready,
  };
}

/**
 * 标准表格属性配置接口
 */
export interface StandardTableProps {
  rowKey?: string;
  scroll?: { x?: number | string; y?: number | string };
  pagination?: {
    pageSize?: number;
    showTotal?: (total: number) => string;
    showJumper?: boolean;
    sizeCanChange?: boolean;
    showSizeChanger?: boolean;
    sizeOptions?: number[];
  };
}

/**
 * 创建标准表格属性配置
 *
 * @param options - 配置选项
 * @returns 表格属性配置对象
 *
 * @example
 * ```typescript
 * // 基本用法
 * const tableProps = createStandardTableProps({
 *   rowKey: '_id',
 *   pageSize: 10,
 *   scrollX: 1200
 * });
 *
 * // 自定义分页选项
 * const tableProps = createStandardTableProps({
 *   rowKey: '_id',
 *   pageSize: 20,
 *   sizeOptions: [20, 50, 100]
 * });
 * ```
 */
export function createStandardTableProps(
  options: {
    rowKey?: string;
    pageSize?: number;
    scrollX?: number | string;
    scrollY?: number | string;
    showTotal?: boolean | ((total: number) => string);
    showJumper?: boolean;
    sizeCanChange?: boolean;
    showSizeChanger?: boolean;
    sizeOptions?: number[];
  } = {},
): StandardTableProps {
  const {
    rowKey = '_id',
    pageSize = 10,
    scrollX = 1500,
    scrollY,
    showTotal: showTotalOption = true,
    showJumper = true,
    sizeCanChange = true,
    showSizeChanger = true,
    sizeOptions = [10, 20, 50, 100],
  } = options;

  const pagination: StandardTableProps['pagination'] = {
    pageSize,
    showJumper,
    sizeCanChange,
    showSizeChanger,
    sizeOptions,
  };

  // 处理 showTotal
  if (showTotalOption) {
    pagination.showTotal = (total: number) => `共 ${total} 条记录`;
  } else if (typeof showTotalOption === 'function') {
    pagination.showTotal = showTotalOption;
  }

  const scroll: StandardTableProps['scroll'] = {};
  if (scrollX !== undefined) {
    scroll.x = scrollX;
  }
  if (scrollY !== undefined) {
    scroll.y = scrollY;
  }

  return {
    rowKey,
    ...(Object.keys(scroll).length > 0 && { scroll }),
    pagination,
  };
}
