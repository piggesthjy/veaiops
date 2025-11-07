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
import { TokenManager } from './api-client';

/**
 * 登录响应数据类型
 */
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  userInfo?: {
    id: string;
    username: string;
    email: string;
  };
}

/**
 * 登录成功后的处理
 * @param loginResponse 登录接口返回的数据
 */
export const handleLoginSuccess = (loginResponse: LoginResponse): void => {
  try {
    // 存储token到sessionStorage
    TokenManager.setToken(loginResponse.token);

    // 如果有refresh token，也存储起来
    if (loginResponse.refreshToken) {
      TokenManager.setRefreshToken(loginResponse.refreshToken);
    }

    Message.success('登录成功');
  } catch (error: unknown) {
    // ✅ 正确：透出实际的错误信息
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorMessage = errorObj.message || '登录状态保存失败';
    Message.error(errorMessage);
  }
};

/**
 * 登出处理
 */
export const handleLogout = (): void => {
  try {
    // 清除所有token
    TokenManager.clearTokens();

    Message.success('已退出登录');

    // 延迟跳转，确保消息显示
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  } catch (error: unknown) {
    // 即使出错也要跳转到登录页（静默处理，不记录日志）
    // ✅ 注意：这里静默处理是预期的行为，确保用户能够跳转到登录页
    if (process.env.NODE_ENV === 'development') {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      console.warn(
        '[auth-helpers] 登出处理失败（静默处理）:',
        errorObj.message,
      );
    }
    window.location.href = '/login';
  }
};

/**
 * 检查用户是否已登录
 */
export const isUserLoggedIn = (): boolean => {
  try {
    const token = TokenManager.getToken();
    return Boolean(token);
  } catch (error: unknown) {
    // Token 检查失败，返回 false（静默处理）
    // ✅ 注意：这里静默处理是预期的行为，确保登录状态检查不会因为异常而阻塞
    if (process.env.NODE_ENV === 'development') {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      console.warn(
        '[auth-helpers] Token 检查失败（静默处理）:',
        errorObj.message,
      );
    }
    return false;
  }
};

/**
 * 获取当前用户token
 */
export const getCurrentToken = (): string | null => {
  try {
    return TokenManager.getToken();
  } catch (error: unknown) {
    // 获取 token 失败，返回 null（静默处理）
    // ✅ 注意：这里静默处理是预期的行为，确保不会因为异常而阻塞
    if (process.env.NODE_ENV === 'development') {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      console.warn(
        '[auth-helpers] 获取 token 失败（静默处理）:',
        errorObj.message,
      );
    }
    return null;
  }
};

/**
 * 强制刷新token
 * @returns 新的token
 */
export const forceRefreshToken = async (): Promise<string | null> => {
  try {
    const newToken = await TokenManager.refreshToken();

    return newToken;
  } catch (error: unknown) {
    // Token 刷新失败，返回 null（静默处理）
    // ✅ 注意：这里静默处理是预期的行为，确保不会因为异常而阻塞
    if (process.env.NODE_ENV === 'development') {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      console.warn(
        '[auth-helpers] Token 刷新失败（静默处理）:',
        errorObj.message,
      );
    }
    return null;
  }
};
