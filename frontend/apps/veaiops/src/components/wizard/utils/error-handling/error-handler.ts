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
 * 数据源向导错误处理工具
 * @description 统一处理向导过程中的各种错误情况
 */

import { Message } from '@arco-design/web-react';

/**
 * 错误类型枚举
 */
export enum WizardErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  EMPTY_DATA = 'EMPTY_DATA',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 错误信息接口
 */
export interface WizardError {
  type: WizardErrorType;
  message: string;
  detail?: string;
  context?: Record<string, any>;
}

/**
 * 创建错误对象
 */
export const createError = (
  type: WizardErrorType,
  message: string,
  detail?: string,
  context?: Record<string, any>,
): WizardError => ({
  type,
  message,
  detail,
  context,
});

/**
 * 处理网络错误
 */
export const handleNetworkError = (
  error: any,
  context?: Record<string, any>,
): WizardError => {
  let message = '网络请求失败，请检查网络连接后重试';

  if (error?.message?.includes('timeout')) {
    message = '请求超时，请稍后重试';
  } else if (error?.message?.includes('abort')) {
    message = '请求已取消';
  }

  Message.error(message);

  return createError(
    WizardErrorType.NETWORK_ERROR,
    message,
    error?.message || String(error),
    context,
  );
};

/**
 * 处理API错误
 */
export const handleApiError = (
  error: any,
  context?: Record<string, any>,
): WizardError => {
  const message =
    error?.body?.message || error?.message || 'API调用失败，请重试';

  Message.error(message);

  return createError(
    WizardErrorType.API_ERROR,
    message,
    error?.body?.detail || error?.message || String(error),
    context,
  );
};

/**
 * 处理空数据错误
 */
export const handleEmptyDataError = (
  dataType: string,
  context?: Record<string, any>,
): WizardError => {
  const message = `未找到${dataType}，请检查配置`;

  Message.warning(message);

  return createError(WizardErrorType.EMPTY_DATA, message, undefined, context);
};

/**
 * 处理验证错误
 */
export const handleValidationError = (
  field: string,
  reason: string,
  context?: Record<string, any>,
): WizardError => {
  const message = `${field}${reason}`;

  Message.error(message);

  return createError(
    WizardErrorType.VALIDATION_ERROR,
    message,
    reason,
    context,
  );
};

/**
 * 处理未知错误
 */
export const handleUnknownError = (
  error: any,
  context?: Record<string, any>,
): WizardError => {
  const message = '操作失败，请稍后重试';

  Message.error(message);

  return createError(
    WizardErrorType.UNKNOWN_ERROR,
    message,
    error?.message || String(error),
    context,
  );
};

/**
 * 统一错误处理入口
 */
export const handleError = (
  error: any,
  context?: Record<string, any>,
): WizardError => {
  // 网络错误
  if (error?.name === 'TypeError' || error?.message?.includes('fetch')) {
    return handleNetworkError(error, context);
  }

  // API错误（带有body的错误）
  if (error?.body || error?.status) {
    return handleApiError(error, context);
  }

  // 验证错误
  if (
    error?.message?.includes('required') ||
    error?.message?.includes('invalid')
  ) {
    return handleValidationError('输入', error?.message, context);
  }

  // 未知错误
  return handleUnknownError(error, context);
};

/**
 * 安全执行异步操作（带错误处理）
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  onError?: (error: WizardError) => void,
  context?: Record<string, any>,
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const wizardError = handleError(error, context);
    if (onError) {
      onError(wizardError);
    }
    return null;
  }
};
