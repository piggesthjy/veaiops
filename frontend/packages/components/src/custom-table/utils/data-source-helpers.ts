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

import type { BaseQuery, BaseRecord } from '@/custom-table/types/core/common';
import type { TableDataSource } from '@/custom-table/types/core/data-source';
import { formatTableData } from '@/custom-table/utils';
import { Message } from '@arco-design/web-react';
import { devLog } from './log-utils';

/**
 * 提取响应数据的辅助函数
 *
 * 为什么使用 unknown：
 * - response 参数需要处理来自不同 API 的响应结构（response.data、response.result 等）
 * - newDataList 需要容纳不同 RecordType 的数据，在格式化前无法确定具体类型
 * - 使用 unknown 比 any 更安全，强制进行类型检查后再使用
 * - 这些数据会在后续步骤中通过 formatTableData 进行类型安全转换
 */
export const extractResponseData = (
  response: unknown,
  dataSource: TableDataSource,
): { newDataList: unknown[]; responseTotal: number } => {
  let newDataList: unknown[] = [];
  let responseTotal = 0;

  if (dataSource.request && typeof dataSource.request === 'function') {
    const responseData = response as {
      data?: unknown[];
      total?: number;
    };
    if (responseData?.data && Array.isArray(responseData.data)) {
      newDataList = responseData.data;
      responseTotal = responseData.total ?? responseData.data.length;
      devLog.log({
        component: 'useDataSource',
        message: 'Data found in request response.data:',
        data: {
          dataLength: newDataList.length,
          total: responseTotal,
        },
      });
    } else {
      devLog.log({
        component: 'useDataSource',
        message: 'No data found in request response.data',
      });
    }
  } else {
    // 原有的serviceInstance[serviceMethod]逻辑
    const itemsKey = dataSource.responseItemsKey as string;
    const responseWithResult = response as {
      result?: Record<string, unknown>;
      [key: string]: unknown;
    };

    if (itemsKey && responseWithResult?.result?.[itemsKey]) {
      const items = responseWithResult.result[itemsKey];
      newDataList = Array.isArray(items) ? items : [];
      devLog.log({
        component: 'useDataSource',
        message: 'Data found in response.result[itemsKey]:',
        data: {
          dataLength: newDataList.length,
        },
      });
    } else if (itemsKey && responseWithResult?.[itemsKey]) {
      const items = responseWithResult[itemsKey];
      newDataList = Array.isArray(items) ? items : [];
      devLog.log({
        component: 'useDataSource',
        message: 'Data found in response[itemsKey]:',
        data: {
          dataLength: newDataList.length,
        },
      });
    } else {
      devLog.log({
        component: 'useDataSource',
        message: 'No data found in response[itemsKey]',
      });
    }
  }

  return { newDataList, responseTotal };
};

/**
 * 处理请求错误的辅助函数
 *
 * 为什么使用 unknown：
 * - error 对象可能来自不同的错误源（网络错误、API 错误等）
 * - 需要兼容不同的错误结构（error.status、error.code、error.statusCode 等）
 * - 使用 unknown 类型更安全，需要先进行类型检查再访问属性
 */
export const handleRequestError = (
  e: unknown,
  _requestId: string,
  dataSource: TableDataSource,
): void => {
  // 处理不同类型的错误对象
  let error:
    | Error
    | {
        message?: string;
        msg?: string;
        status?: number;
        code?: number;
        statusCode?: number;
      };

  if (e instanceof Error) {
    error = e;
  } else if (typeof e === 'object' && e !== null) {
    error = e as {
      message?: string;
      msg?: string;
      status?: number;
      code?: number;
      statusCode?: number;
    };
  } else {
    error = { message: String(e) };
  }

  const errorMessage =
    (error as { message?: string; msg?: string }).message ||
    (error as { msg?: string }).msg ||
    '请求失败';
  const statusCode: number | undefined =
    (error as { status?: number; code?: number; statusCode?: number }).status ||
    (error as { code?: number }).code ||
    (error as { statusCode?: number }).statusCode;

  // 记录详细的错误日志
  devLog.error({
    component: 'useDataSource',
    message: 'Request failed:',
    data: {
      error: errorMessage,
      statusCode: statusCode ?? 'unknown',
      url: (dataSource as { apiUrl?: string })?.apiUrl || 'unknown',
    },
  });

  // ✅ 正确：根据错误类型决定是否显示错误消息，优先透出实际错误信息
  // 注意：对于特定状态码（404、500+），在基础消息上追加实际错误信息
  if (statusCode === 404) {
    const finalMessage =
      errorMessage && errorMessage !== '请求失败'
        ? `请求的资源不存在: ${errorMessage}`
        : '请求的资源不存在';
    Message.error(finalMessage);
  } else if (statusCode && statusCode >= 500) {
    const finalMessage =
      errorMessage && errorMessage !== '请求失败'
        ? `服务器错误: ${errorMessage}`
        : '服务器错误，请稍后重试';
    Message.error(finalMessage);
  } else if (statusCode && statusCode >= 400) {
    // ✅ 正确：透出实际错误信息
    Message.error(errorMessage);
  } else {
    // ✅ 正确：对于无状态码的错误，优先显示实际错误信息
    const finalMessage =
      errorMessage && errorMessage !== '请求失败'
        ? errorMessage
        : '请求失败，请检查网络连接';
    Message.error(finalMessage);
  }

  // 将 unknown 类型的错误转换为 Error 对象
  const errorObj = e instanceof Error ? e : new Error(String(errorMessage));
  dataSource?.onError?.(errorObj);
  dataSource?.onFinally?.();
};

/**
 * 构建请求结果
 *
 * 为什么使用 unknown：
 * - response 需要处理不同 API 的响应结构
 * - newDataList 在格式化前无法确定具体 RecordType
 * - query 使用 Record<string, unknown> 以兼容不同的查询参数类型
 * - 使用 unknown 比 any 更安全，强制进行类型检查后再使用
 * - 这些数据会在后续步骤中进行类型安全转换
 */
export const buildRequestResult = (
  response: unknown,
  newDataList: unknown[],
  responseTotal: number,
  dataSource: TableDataSource,
  current: number,
  setCurrent: (updater: number | ((prev: number) => number)) => void,
  isQueryChange: boolean,
  query: Record<string, unknown>,
): { list: unknown[]; total: number } => {
  // 处理分页为空的情况
  if (newDataList.length === 0 && current > 1) {
    setCurrent((prevState: number) => prevState - 1);
  }

  // 先提取 responseData 用于后续计算
  const responseData = response as {
    Result?: { pageResp?: { totalCount?: number } };
    result?: { pageResp?: { totalCount?: number } };
    [key: string]: unknown;
  };

  // 格式化结果
  const result = {
    list: formatTableData({
      sourceData: newDataList,
      addRowKey: Boolean(dataSource?.addRowKey),
      arrayFields: dataSource?.arrayFields || [],
      formatDataConfig: (dataSource?.formatDataConfig || {}) as Record<
        string,
        unknown
      >,
    }),
    total:
      dataSource.request && typeof dataSource.request === 'function'
        ? responseTotal
        : responseData.Result?.pageResp?.totalCount ||
          responseData.result?.pageResp?.totalCount ||
          newDataList?.length ||
          0,
  };

  devLog.log({
    component: 'useDataSource',
    message: 'Final result:',
    data: {
      listLength: result.list?.length || 0,
      total: result.total,
      responseTotal,
      isRequestFunction:
        dataSource.request && typeof dataSource.request === 'function',
    },
  });

  // 成功回调
  const responseResultData =
    (responseData.Result as Record<string, unknown>) ||
    (responseData.result as Record<string, unknown>) ||
    {};
  if (dataSource?.onSuccess) {
    // result.list 已在 formatTableData 中处理，类型已转换
    // 使用类型断言因为 formatTableData 返回的是格式化后的数据，符合 BaseRecord 要求
    dataSource.onSuccess({
      query: query as BaseQuery,
      v: result?.list as BaseRecord[],
      extra: responseResultData
        ? Object.keys(responseResultData)
            .filter((key) => key !== dataSource.responseItemsKey)
            .reduce((obj: Record<string, unknown>, key: string) => {
              obj[key] = responseResultData[key];
              return obj;
            }, {})
        : {},
      isQueryChange,
    });
  }

  dataSource?.onFinally?.();

  return result;
};
