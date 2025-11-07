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

import type { SubscribeRelationWithAttributes } from 'api-generate';
import { useEffect, useState } from 'react';

/**
 * Webhook管理Hook的返回值类型
 */
export interface UseWebhookManagementReturn {
  webhookHeaders: Array<{ key: string; value: string }>;
  addWebhookHeader: () => void;
  removeWebhookHeader: (index: number) => void;
  updateWebhookHeader: (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => void;
  resetWebhookHeaders: () => void;
}

/**
 * Webhook管理Hook参数
 */
export interface UseWebhookManagementParams {
  /** 初始数据（编辑模式时使用） */
  initialData?: SubscribeRelationWithAttributes | null;
}

/**
 * 将后端返回的 webhook_headers 对象转换为前端表单使用的数组格式
 *
 * @param webhookHeadersObj - 后端返回的 webhook_headers 对象
 * @returns 前端表单使用的数组格式
 *
 * @example
 * ```ts
 * const headers = convertWebhookHeadersToArray({
 *   'Content-Type': 'application/json',
 *   'Authorization': 'Bearer token'
 * });
 * // 返回: [
 * //   { key: 'Content-Type', value: 'application/json' },
 * //   { key: 'Authorization', value: 'Bearer token' }
 * // ]
 * ```
 */
const convertWebhookHeadersToArray = (
  webhookHeadersObj: Record<string, string> | undefined | null,
): Array<{ key: string; value: string }> => {
  if (!webhookHeadersObj || typeof webhookHeadersObj !== 'object') {
    return [];
  }

  return Object.entries(webhookHeadersObj).map(([key, value]) => ({
    key,
    value,
  }));
};

/**
 * Webhook管理Hook
 * 提供Webhook请求头的状态管理功能
 *
 * @param params - Hook参数
 * @returns Webhook管理函数和状态
 */
export const useWebhookManagement = ({
  initialData,
}: UseWebhookManagementParams = {}): UseWebhookManagementReturn => {
  const [webhookHeaders, setWebhookHeaders] = useState<
    Array<{ key: string; value: string }>
  >(() => {
    // 初始化时从 initialData 中提取 webhook_headers
    if (initialData?.webhook_headers) {
      return convertWebhookHeadersToArray(initialData.webhook_headers);
    }
    return [];
  });

  // 当 initialData 变化时，重新初始化 webhookHeaders
  useEffect(() => {
    if (initialData?.webhook_headers) {
      setWebhookHeaders(
        convertWebhookHeadersToArray(initialData.webhook_headers),
      );
    } else {
      setWebhookHeaders([]);
    }
  }, [initialData]);

  /**
   * 添加 Webhook 请求头
   */
  const addWebhookHeader = () => {
    setWebhookHeaders([...webhookHeaders, { key: '', value: '' }]);
  };

  /**
   * 删除 Webhook 请求头
   */
  const removeWebhookHeader = (index: number) => {
    const newHeaders = webhookHeaders.filter((_, i) => i !== index);
    setWebhookHeaders(newHeaders);
  };

  /**
   * 更新 Webhook 请求头
   */
  const updateWebhookHeader = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    const newHeaders = [...webhookHeaders];
    newHeaders[index][field] = value;
    setWebhookHeaders(newHeaders);
  };

  /**
   * 重置 Webhook 请求头
   */
  const resetWebhookHeaders = () => {
    setWebhookHeaders([]);
  };

  return {
    webhookHeaders,
    addWebhookHeader,
    removeWebhookHeader,
    updateWebhookHeader,
    resetWebhookHeaders,
  };
};

export default useWebhookManagement;
