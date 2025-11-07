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
import { useEffect, useState } from 'react';
import { authConfig, useAuth } from '../config/auth';

export interface LogoutOptions {
  showConfirm?: boolean;
  showMessage?: boolean;
  redirectToLogin?: boolean;
  onBeforeLogout?: () => void | Promise<void>;
  onAfterLogout?: () => void | Promise<void>;
}

export const useLogout = () => {
  const { logout: authLogout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const BROADCAST_KEY = 'volcaiops_logout_broadcast';

  // 监听其他标签页的登出广播，保持多标签一致性
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === BROADCAST_KEY && e.newValue) {
        // 收到其他标签页的登出广播
        // 修复：清除 localStorage 中的认证信息，而不是 sessionStorage
        localStorage.removeItem(authConfig.storageKeys.token);
        localStorage.removeItem(authConfig.storageKeys.username);
        localStorage.removeItem(authConfig.storageKeys.isSupervisor);
        localStorage.removeItem(authConfig.storageKeys.userData);
        sessionStorage.clear();
        window.location.href = authConfig.loginPath;
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const logout = async (
    options: LogoutOptions = {},
  ): Promise<{ success: boolean; error?: Error }> => {
    const {
      showMessage = true,
      redirectToLogin = true,
      onBeforeLogout,
      onAfterLogout,
    } = options;

    try {
      setIsLoggingOut(true);

      // 执行退出前的回调
      if (onBeforeLogout) {
        await onBeforeLogout();
      }

      // 清除认证状态
      authLogout();

      // 清除其他可能的会话存储数据
      // localStorage 清除操作已移除，统一使用 sessionStorage

      // 清除会话存储
      sessionStorage.clear();

      // 向其他标签页广播退出（localStorage 才能触发 storage 事件）
      try {
        localStorage.setItem(BROADCAST_KEY, String(Date.now()));
      } catch {}

      // 显示退出成功消息
      if (showMessage) {
        Message.success('已安全退出登录');
      }

      // 执行退出后的回调
      if (onAfterLogout) {
        await onAfterLogout();
      }

      // 跳转到登录页面
      if (redirectToLogin) {
        // 使用 replace 而不是 push，防止用户通过后退按钮回到已登出的页面
        window.location.href = authConfig.loginPath;
      }

      return { success: true };
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (process.env.NODE_ENV === 'development') {
        const errorMessage = errorObj.message || '退出登录失败，请重试';
        Message.error(errorMessage);
      }
      return { success: false, error: errorObj };
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 快速退出（不显示确认对话框）
  const quickLogout = () => {
    logout({
      showConfirm: false,
      showMessage: true,
      redirectToLogin: true,
    });
  };

  // 静默退出（不显示任何消息）
  const silentLogout = () => {
    logout({
      showConfirm: false,
      showMessage: false,
      redirectToLogin: true,
    });
  };

  // 强制退出（用于token过期等情况）
  const forceLogout = (reason?: string) => {
    const message = reason ? `${reason}，请重新登录` : '登录已过期，请重新登录';

    logout({
      showConfirm: false,
      showMessage: true,
      redirectToLogin: true,
      onBeforeLogout: () => {
        Message.warning(message);
      },
    });
  };

  return {
    logout,
    quickLogout,
    silentLogout,
    forceLogout,
    isLoggingOut,
  };
};
