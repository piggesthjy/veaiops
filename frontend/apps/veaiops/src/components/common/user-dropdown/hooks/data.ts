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

import { authConfig } from '@/config/auth';
import { logger } from '@veaiops/utils';
import { useRequest } from 'ahooks';
import { getUserInfo } from '../lib/api';
import type { ExtendedUser } from '../lib/types';

/**
 * useUserData Hook 参数
 */
export interface UseUserDataParams {
  username?: string;
}

/**
 * 用户数据管理 Hook
 *
 * 功能：
 * - 从 localStorage 读取用户数据
 * - 根据 username 获取用户的 supervisor 状态
 * - 缓存用户数据到 localStorage
 */
export const useUserData = ({ username }: UseUserDataParams) => {
  // 从 localStorage 读取用户数据
  const getStoredUserData = (): ExtendedUser => {
    try {
      const raw = localStorage.getItem(authConfig.storageKeys.userData) || '{}';
      return JSON.parse(raw) as ExtendedUser;
    } catch (e) {
      logger.warn({
        message: '用户数据解析失败，已回退为空对象',
        data: {
          error: e instanceof Error ? e.message : String(e),
          stack: e instanceof Error ? e.stack : undefined,
          errorObj: e,
        },
        source: 'UserDropdown',
        component: 'getStoredUserData',
      });
      return {};
    }
  };

  const editingUser = getStoredUserData();

  // 获取用户 supervisor 状态
  const { data: isSupervisor } = useRequest(
    async () => {
      if (!username) {
        return undefined;
      }

      // 先从 localStorage 读取缓存
      const cachedSupervisor = localStorage.getItem(
        authConfig.storageKeys.isSupervisor,
      );
      if (cachedSupervisor) {
        return cachedSupervisor;
      }

      // 从 API 获取用户信息
      const data = await getUserInfo({ username });
      if (!data) {
        return undefined;
      }

      // 类型安全访问：is_supervisor 是 boolean 类型
      const isSupervisorValue = data.is_supervisor ?? false;
      const supervisorString = isSupervisorValue ? 'true' : 'false';

      // 缓存到 localStorage
      localStorage.setItem(
        authConfig.storageKeys.isSupervisor,
        supervisorString,
      );
      localStorage.setItem(
        authConfig.storageKeys.userData,
        JSON.stringify({
          ...data,
          id: data._id,
          role: isSupervisorValue ? 'admin' : 'user',
        }),
      );

      return supervisorString;
    },
    {
      refreshDeps: [username],
    },
  );

  return {
    editingUser,
    isSupervisor,
  };
};
