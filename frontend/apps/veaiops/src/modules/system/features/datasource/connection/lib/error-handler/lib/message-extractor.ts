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

import { hasMessage, hasResponse } from './type-guards';

/**
 * 从错误对象中提取错误消息
 *
 * 优先级：
 * 1. Error 实例的 message 属性
 * 2. 对象中包含 message 属性的值
 * 3. 嵌套的错误对象（error.error.message、error.response.data.message）
 * 4. 默认错误消息（仅在完全无法提取时使用）
 *
 * @param error 错误对象（unknown 类型）
 * @returns 提取的错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  // 1. 字符串类型直接返回
  if (typeof error === 'string') {
    return error;
  }

  // 2. Error 实例
  if (error instanceof Error) {
    return error.message || '未知错误';
  }

  // 3. 对象中包含 message 属性
  if (hasMessage(error)) {
    const { message } = error;
    if (typeof message === 'string' && message) {
      return message;
    }
  }

  // 4. 嵌套错误对象 error.error.message
  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error
  ) {
    const { error: nestedError } = error as { error: unknown };
    if (
      typeof nestedError === 'object' &&
      nestedError !== null &&
      'message' in nestedError
    ) {
      const { message: nestedMessage } = nestedError as { message: unknown };
      if (typeof nestedMessage === 'string' && nestedMessage) {
        return nestedMessage;
      }
    }
  }

  // 5. HTTP 响应错误 error.response.data.message
  if (hasResponse(error) && error.response?.data) {
    const responseData = error.response.data;
    if (
      typeof responseData === 'object' &&
      responseData !== null &&
      'message' in responseData &&
      typeof responseData.message === 'string' &&
      responseData.message
    ) {
      return responseData.message;
    }
    if (
      typeof responseData === 'object' &&
      responseData !== null &&
      'error' in responseData &&
      typeof responseData.error === 'string' &&
      responseData.error
    ) {
      return responseData.error;
    }
  }

  // 6. 完全无法提取时返回默认消息
  return '未知错误';
}
