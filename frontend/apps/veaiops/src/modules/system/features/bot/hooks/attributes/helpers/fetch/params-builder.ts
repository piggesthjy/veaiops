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

import type { FetchAttributesParams } from '@bot/lib';
import type { LastRequestParams } from '@bot/types';
import { logger } from '@veaiops/utils';
import { AttributeKey } from 'api-generate';

/**
 * 构建API请求参数
 */
export const buildFetchAttributesParams = ({
  requestParams,
  lastRequestParamsRef,
}: {
  requestParams?: FetchAttributesParams;
  lastRequestParamsRef: React.MutableRefObject<LastRequestParams>;
}) => {
  // 记录函数调用和传入的参数
  // 避免循环引用：只记录数组/对象的值，不记录整个对象
  logger.info({
    message: 'fetchAttributes 被调用',
    data: {
      hasRequestParams: requestParams !== undefined,
      names: Array.isArray(requestParams?.names)
        ? [...requestParams.names]
        : requestParams?.names,
      value: requestParams?.value,
      savedNames: Array.isArray(lastRequestParamsRef.current.names)
        ? [...lastRequestParamsRef.current.names]
        : lastRequestParamsRef.current.names,
      savedValue: lastRequestParamsRef.current.value,
    },
    source: 'useBotAttributes',
    component: 'fetchAttributes',
  });

  // 提取筛选参数
  const { names, value, ...otherParams } = requestParams || {};

  // 如果有传入新参数，更新保存的参数
  // 注意：只有当 requestParams 不是 undefined 时才更新（区分"有参数但值为空"和"无参数"）
  if (requestParams !== undefined) {
    const oldParams = { ...lastRequestParamsRef.current };
    lastRequestParamsRef.current = {
      // 如果传入的 names 存在则使用，否则保持上一次的值
      names: names !== undefined ? names : lastRequestParamsRef.current.names,
      // value 如果是 undefined 表示未传入，使用上一次的值；如果是空字符串则使用空字符串
      value: value !== undefined ? value : lastRequestParamsRef.current.value,
    };

    // 记录参数更新
    // 避免循环引用：只记录数组的值
    logger.info({
      message: '更新保存的筛选参数',
      data: {
        oldNames: Array.isArray(oldParams.names)
          ? [...oldParams.names]
          : oldParams.names,
        oldValue: oldParams.value,
        newNames: Array.isArray(lastRequestParamsRef.current.names)
          ? [...lastRequestParamsRef.current.names]
          : lastRequestParamsRef.current.names,
        newValue: lastRequestParamsRef.current.value,
        incomingNames: Array.isArray(names) ? [...names] : names,
        incomingValue: value,
      },
      source: 'useBotAttributes',
      component: 'fetchAttributes',
    });
  } else {
    logger.info({
      message: '未传入参数，使用保存的参数',
      data: {
        savedNames: Array.isArray(lastRequestParamsRef.current.names)
          ? [...lastRequestParamsRef.current.names]
          : lastRequestParamsRef.current.names,
        savedValue: lastRequestParamsRef.current.value,
      },
      source: 'useBotAttributes',
      component: 'fetchAttributes',
    });
  }

  // 构建 API 请求参数
  // 优先使用传入的参数，如果未传入则使用保存的参数，最后使用默认值
  const finalNames =
    names !== undefined
      ? names
      : lastRequestParamsRef.current.names || [AttributeKey.PROJECT];
  const finalValue =
    value !== undefined ? value : lastRequestParamsRef.current.value;

  const params = {
    skip: otherParams.skip || 0,
    limit: otherParams.limit || 100,
    names: finalNames, // 类目筛选（多选），确保始终有值
    value: finalValue || undefined, // 内容筛选（模糊搜索）
  };

  // 记录最终构建的 API 请求参数
  // 避免循环引用：只记录数组的值
  logger.info({
    message: '构建 API 请求参数',
    data: {
      skip: params.skip,
      limit: params.limit,
      names: Array.isArray(finalNames) ? [...finalNames] : finalNames,
      value: finalValue,
      finalNames: Array.isArray(finalNames) ? [...finalNames] : finalNames,
      finalValue,
      namesSource: names !== undefined ? '传入参数' : '保存的参数',
      valueSource: value !== undefined ? '传入参数' : '保存的参数',
    },
    source: 'useBotAttributes',
    component: 'fetchAttributes',
  });

  return params;
};
