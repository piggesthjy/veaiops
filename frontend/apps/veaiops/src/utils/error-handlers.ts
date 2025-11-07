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
import { StatusCodes } from 'http-status-codes';
import type { ErrorHandlerConfig } from './error-types';
import { isApiError } from './error-utils';

/**
 * 从错误对象中提取错误消息
 */
function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const errorObj = error as {
      body?: { message?: string; error?: string };
      message?: string;
    };
    return (
      errorObj?.body?.message ||
      errorObj?.body?.error ||
      errorObj?.message ||
      ''
    );
  }
  return '';
}

/**
 * handleHttpStatusError 参数接口
 */
interface HandleHttpStatusErrorParams {
  status: number;
  errorMessage: string;
  config: ErrorHandlerConfig;
}

/**
 * 处理 HTTP 状态码错误
 */
function handleHttpStatusError({
  status,
  errorMessage,
  config,
}: HandleHttpStatusErrorParams): void {
  const {
    unauthorizedMessage = '未授权，请重新登录',
    notFoundMessage = '资源不存在',
    conflictMessage = '资源冲突',
    defaultMessage = '操作失败，请稍后重试',
  } = config;

  switch (status) {
    case StatusCodes.BAD_REQUEST:
      Message.error(
        errorMessage || config.unauthorizedMessage || '用户名或密码错误',
      );
      break;
    case StatusCodes.UNAUTHORIZED:
      Message.error(errorMessage || unauthorizedMessage);
      break;
    case StatusCodes.NOT_FOUND:
      Message.error(errorMessage || notFoundMessage);
      break;
    case StatusCodes.CONFLICT:
      Message.error(errorMessage || conflictMessage);
      break;
    default:
      Message.error(errorMessage || defaultMessage);
      break;
  }
}

/**
 * handleNonApiError 参数接口
 */
interface HandleNonApiErrorParams {
  error: unknown;
  config: ErrorHandlerConfig;
}

/**
 * 处理非 API 错误
 */
function handleNonApiError({ error, config }: HandleNonApiErrorParams): void {
  const { defaultMessage = '操作失败，请稍后重试' } = config;

  // 检查是否是包含 response 的错误对象（如 fetch 错误）
  if (error && typeof error === 'object' && 'response' in error) {
    const { response } = error as any;
    if (response?.status) {
      const errorMessage = response.data?.message || response.message;
      handleHttpStatusError({
        status: response.status,
        errorMessage,
        config,
      });
      return;
    }
  }

  // ✅ 正确：透出实际的错误信息，而不是使用固定消息
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    errorMessage = defaultMessage;
  }
  Message.error(errorMessage);
}

/**
 * handleApiErrorObject 参数接口
 */
interface HandleApiErrorObjectParams {
  error: unknown;
  config: ErrorHandlerConfig;
}

/**
 * 处理 API 错误
 */
function handleApiErrorObject({
  error,
  config,
}: HandleApiErrorObjectParams): void {
  const errorMessage = extractErrorMessage(error);
  // 检查 error 是否有 status 属性
  const errorWithStatus =
    error && typeof error === 'object' && 'status' in error
      ? (error as { status: number })
      : null;
  const status = errorWithStatus?.status || 500;
  handleHttpStatusError({
    status,
    errorMessage,
    config,
  });
}

/**
 * 公共错误处理函数
 * @param error 错误对象
 * @param config 错误处理配置
 */
/**
 * handleApiError 参数接口
 */
export interface HandleApiErrorParams {
  error: unknown;
  config?: ErrorHandlerConfig;
}

/**
 * 公共错误处理函数
 * @param params 错误处理参数
 */
export function handleApiError({
  error,
  config = {},
}: HandleApiErrorParams): void {
  if (isApiError(error)) {
    handleApiErrorObject({ error, config });
  } else {
    handleNonApiError({ error, config });
  }
}

/**
 * 用户管理相关的错误处理
 */
export const userErrorHandler = {
  fetchUsers: (error: unknown) => {
    handleApiError({
      error,
      config: {
        defaultMessage: '获取用户列表失败',
      },
    });
  },

  createUser: (error: unknown) => {
    handleApiError({
      error,
      config: {
        conflictMessage: '用户名或邮箱已存在',
        defaultMessage: '创建用户失败',
      },
    });
  },

  updateUser: (error: unknown) => {
    handleApiError({
      error,
      config: {
        conflictMessage: '用户名或邮箱已存在',
        notFoundMessage: '用户不存在',
        defaultMessage: '更新用户失败',
      },
    });
  },

  deleteUser: (error: unknown) => {
    handleApiError({
      error,
      config: {
        notFoundMessage: '用户不存在',
        defaultMessage: '删除用户失败',
      },
    });
  },
};

/**
 * 认证相关的错误处理
 */
export const authErrorHandler = {
  login: (error: unknown) => {
    // 对于登录错误，统一显示用户友好的中文提示
    if (process.env.NODE_ENV === 'development') {
      // 检查是否是 400 错误（用户名或密码错误）
      if (error && typeof error === 'object') {
        if (
          'status' in error &&
          (error as any).status === StatusCodes.BAD_REQUEST
        ) {
          Message.error('用户名或密码错误');
        }
        return;
      }
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status ===
          StatusCodes.BAD_REQUEST
      ) {
        Message.error('用户名或密码错误');
        return;
      }
    }

    // 其他错误情况
    handleApiError({
      error,
      config: {
        unauthorizedMessage: '用户名或密码错误',
        defaultMessage: '登录失败，请稍后重试',
      },
    });
  },
};
