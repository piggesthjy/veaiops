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
 * VolcAIOpsKit API Hooks
 *
 * 此文件提供 React Hooks 来使用生成的 API 客户端
 */

import { useEffect, useState } from 'react';
import { getApiClient, getAuthService } from './api-client';

// Type definitions for API responses
interface ApiResponse<T = unknown> {
  data: T;
}

interface ApiResponseArray<T = unknown> extends ApiResponse<T[]> {
  data: T[];
}

// Exported parameter interfaces for API hooks
export interface LoginParams {
  username: string;
  password: string;
}

export interface FetchUsersParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  username?: string;
}

export interface UpdateUserParams {
  id: string;
  // 注意：使用 updates 对象允许批量更新多个字段
  updates?: {
    username?: string;
    is_active?: boolean;
    is_supervisor?: boolean;
  };
  // 为了向后兼容，也支持直接传递字段
  username?: string;
  is_active?: boolean;
  is_supervisor?: boolean;
}

interface ApiError {
  message?: string;
  status?: number;
  response?: {
    status?: number;
  };
}

// ============================================================================
// 认证相关 Hooks
// ============================================================================

/**
 * 用户登录 Hook
 */
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async ({ username, password }: LoginParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAuthService().login_for_access_token({
        params: { username, password },
      });

      // Token 会自动存储在 localStorage 中
      return (response as ApiResponse).data;
    } catch (err: unknown) {
      const errorMessage = (err as ApiError)?.message || '登录失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    error,
  };
}

/**
 * 认证状态 Hook
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(Boolean(token));
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    logout,
  };
}

// ============================================================================
// 用户管理 Hooks
// ============================================================================

/**
 * 用户列表 Hook
 */
export function useUsers() {
  const [users, setUsers] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async ({
    page = 1,
    pageSize = 20,
  }: FetchUsersParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const skip = (page - 1) * pageSize;
      const response = await getApiClient().list_users({
        params: { skip, limit: pageSize },
      });
      setUsers((response as ApiResponseArray).data || []);
      return (response as ApiResponseArray).data;
    } catch (err: unknown) {
      const errorMessage = (err as ApiError)?.message || '获取用户列表失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
  };
}

/**
 * 单个用户 Hook
 */
export function useUser(userId?: string) {
  const [user, setUser] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getApiClient().get_user({ user_id: id });
      setUser((response as ApiResponse).data);
      return (response as ApiResponse).data;
    } catch (err: unknown) {
      const errorMessage = (err as ApiError)?.message || '获取用户信息失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async ({
    id,
    updates,
    ...directFields
  }: UpdateUserParams) => {
    setLoading(true);
    setError(null);

    try {
      // 合并 updates 对象和直接传递的字段
      const updateData = {
        ...updates,
        ...(directFields.username !== undefined && {
          username: directFields.username,
        }),
        ...(directFields.is_active !== undefined && {
          is_active: directFields.is_active,
        }),
        ...(directFields.is_supervisor !== undefined && {
          is_supervisor: directFields.is_supervisor,
        }),
      };
      const response = await getApiClient().update_user(
        { user_id: id },
        updateData,
      );
      setUser((response as ApiResponse).data);
      return (response as ApiResponse).data;
    } catch (err: unknown) {
      const errorMessage = (err as ApiError)?.message || '更新用户信息失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await getApiClient().delete_user({ user_id: id });
      setUser(null);
    } catch (err: unknown) {
      const errorMessage = (err as ApiError)?.message || '删除用户失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId]);

  return {
    user,
    loading,
    error,
    fetchUser,
    updateUser,
    deleteUser,
  };
}

// ============================================================================
// 系统配置 Hooks
// ============================================================================

/**
 * 全局配置 Hook
 */
export function useGlobalConfig() {
  const [config, setConfig] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getApiClient().get_global_config();
      setConfig((response as ApiResponse).data);
      return (response as ApiResponse).data;
    } catch (err: unknown) {
      const errorMessage = (err as ApiError)?.message || '获取全局配置失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    error,
    fetchConfig,
  };
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * API 错误处理工具
 */
export function handleApiError(error: unknown) {
  const apiError = error as ApiError;
  const status = apiError.status || apiError.response?.status;

  switch (status) {
    case 401:
      // Token 过期，清除本地存储并跳转到登录页
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      break;

    case 403:
      break;

    case 404:
      break;

    case 500:
      break;

    default:
  }
}

/**
 * 重试机制 Hook
 */
export interface UseRetryParams<T> {
  apiCall: () => Promise<T>;
  maxRetries?: number;
  delay?: number;
}

export function useRetry<T>({
  apiCall,
  maxRetries = 3,
  delay = 1000,
}: UseRetryParams<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);

    let lastError: unknown;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await apiCall();
        setLoading(false);
        return result;
      } catch (error) {
        lastError = error;

        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i));
        }
      }
    }

    setError((lastError as ApiError)?.message || '请求失败');
    setLoading(false);
    throw lastError;
  };

  return {
    execute,
    loading,
    error,
  };
}
