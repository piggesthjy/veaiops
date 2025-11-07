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

import { Message } from '@arco-design/web-react';
import { logger } from '@veaiops/utils';
import { getErrorMessage } from './message-extractor';
import { hasMessage, hasResponse, hasStatus, isNetworkError } from './type-guards';

/**
 * 显示错误消息参数接口
 */
export interface ShowErrorMessageParams {
  error: unknown;
  defaultMessage?: string;
}

/**
 * 显示错误消息
 */
export function showErrorMessage({ error, defaultMessage = '操作失败' }: ShowErrorMessageParams): void {
  const message = getErrorMessage(error) || defaultMessage;
  Message.error(message);
}

/**
 * 处理API错误参数接口
 */
export interface HandleApiErrorParams {
  error: unknown;
  context?: string;
}

/**
 * 处理API错误
 */
export function handleApiError({ error, context }: HandleApiErrorParams): void {
  // ✅ 正确：使用类型守卫创建 Error 对象
  const errorObj =
    error instanceof Error ? error : new Error(String(error));

  logger.error({
    message: `API Error${context ? ` in ${context}` : ''}`,
    data: {
      error: errorObj.message,
      stack: errorObj.stack,
      originalError: error,
    },
    source: 'ErrorHandler',
    component: 'handleApiError',
  });

  const message = getErrorMessage(error);
  Message.error(message);
}

/**
 * 处理网络错误
 * @param error 错误对象（unknown 类型）
 */
export function handleNetworkError(error: unknown): void {
  // ✅ 正确：使用类型守卫创建 Error 对象
  const errorObj =
    error instanceof Error ? error : new Error(String(error));

  logger.error({
    message: 'Network Error',
    data: {
      error: errorObj.message,
      stack: errorObj.stack,
      originalError: error,
    },
    source: 'ErrorHandler',
    component: 'handleNetworkError',
  });

  // ✅ 正确：透出实际的错误信息，而不是使用固定消息
  // 优先提取实际错误信息，只有在无法提取时才使用默认消息
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (hasMessage(error)) {
    const { message } = error;
    errorMessage = typeof message === 'string' && message ? message : '网络请求失败';
  } else if (isNetworkError(error)) {
    errorMessage = '网络连接失败，请检查网络设置';
  } else {
    errorMessage = '网络请求失败';
  }

  // 优先显示实际错误信息
  Message.error(errorMessage);
}

/**
 * 处理权限错误
 * @param error 错误对象（unknown 类型）
 */
export function handlePermissionError(error: unknown): void {
  // ✅ 正确：使用类型守卫创建 Error 对象
  const errorObj =
    error instanceof Error ? error : new Error(String(error));

  logger.error({
    message: 'Permission Error',
    data: {
      error: errorObj.message,
      stack: errorObj.stack,
      originalError: error,
    },
    source: 'ErrorHandler',
    component: 'handlePermissionError',
  });

  // ✅ 正确：透出实际的错误信息，而不是使用固定消息
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (hasMessage(error)) {
    const { message } = error;
    errorMessage = typeof message === 'string' && message ? message : '访问被拒绝';
  } else {
    errorMessage = '访问被拒绝';
  }

  // 优先显示实际错误信息，如果没有则根据状态码提供默认提示
  if (errorMessage && errorMessage !== '访问被拒绝') {
    Message.error(errorMessage);
  } else if (
    (hasStatus(error) && error.status === 403) ||
    (hasResponse(error) && error.response?.status === 403)
  ) {
    Message.error('权限不足，请联系管理员');
  } else {
    Message.error(errorMessage || '访问被拒绝');
  }
}

/**
 * 通用错误处理器参数接口
 */
export interface HandleErrorOptions {
  context?: string;
  showMessage?: boolean;
  logError?: boolean;
}

/**
 * 通用错误处理器
 * @param error 错误对象（unknown 类型）
 * @param options 处理选项
 */
export function handleError(
  error: unknown,
  options: HandleErrorOptions = {},
): void {
  const { context, showMessage = true, logError = true } = options;

  if (logError) {
    // ✅ 正确：使用类型守卫创建 Error 对象
    const errorObj =
      error instanceof Error ? error : new Error(String(error));

    logger.error({
      message: `Error${context ? ` in ${context}` : ''}`,
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        originalError: error,
      },
      source: 'ErrorHandler',
      component: context || 'handleError',
    });
  }

  if (showMessage) {
    const message = getErrorMessage(error);
    Message.error(message);
  }
}
