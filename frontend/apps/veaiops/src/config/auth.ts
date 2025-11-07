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

import { useEffect, useState } from 'react';

// 认证状态接口
export interface AuthState {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  user: {
    username: string;
    token: string;
    isSupervisor?: string;
    userData?: string;
  } | null;
}

// 认证配置
export const authConfig = {
  // 存储键名
  storageKeys: {
    token: 'access_token',
    username: 'username',
    isSupervisor: 'is_supervisor',
    userData: 'id',
  },
  // 默认重定向路径 - 跳转到第一个顶导的第一个菜单
  defaultRedirectPath: '/statistics/overview',
  loginPath: '/login',
  // Token过期时间（毫秒）
  tokenExpireTime: 7 * 24 * 60 * 60 * 1000, // 7天
  // 开发模式配置 - 设置为 true 可绕过登录验证
  devMode: {
    enabled: process.env.NODE_ENV === 'development', // 仅在开发环境启用
    bypassAuth: false, // 设置为 false 使用真实认证，true 绕过认证
    mockUser: {
      username: 'dev-user',
      token: `dev-mock-token-${Date.now()}`,
    },
  },
} as const;

// 认证Hook
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: null,
    isLoading: true,
    user: null,
  });

  // 初始化认证状态
  useEffect(() => {
    // 修复：使用 localStorage 替代 sessionStorage，以支持跨标签页共享认证状态
    // 原因：sessionStorage 是基于浏览器会话的，每个标签页都有独立的存储空间
    // 当使用 target="_blank" 打开新标签页时，新标签页无法访问父标签页的 sessionStorage
    const token = localStorage.getItem(authConfig.storageKeys.token);
    const username = localStorage.getItem(authConfig.storageKeys.username);

    if (token && username) {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: { username, token },
      });
    } else {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  }, []);

  // 登录
  interface LoginParams {
    username: string;
    token: string;
  }

  const login = ({ username, token }: LoginParams) => {
    // 修复：使用 localStorage 替代 sessionStorage，以支持跨标签页共享认证状态
    localStorage.setItem(authConfig.storageKeys.token, token);
    localStorage.setItem(authConfig.storageKeys.username, username);

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: { username, token },
    });
  };

  // 登出
  const logout = () => {
    // 修复：使用 localStorage 替代 sessionStorage
    localStorage.removeItem(authConfig.storageKeys.token);
    localStorage.removeItem(authConfig.storageKeys.username);
    localStorage.removeItem(authConfig.storageKeys.isSupervisor);
    localStorage.removeItem(authConfig.storageKeys.userData);

    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  };

  // 检查是否已认证
  const isAuthenticated = () => {
    return authState.isAuthenticated === true;
  };

  // 检查是否正在加载
  const isLoading = () => {
    return authState.isLoading;
  };

  return {
    ...authState,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };
};
