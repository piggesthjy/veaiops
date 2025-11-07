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

import { useLogout } from '@/hooks/use-logout';
import { Message } from '@arco-design/web-react';
import type { UpdatePasswordRequest } from '@veaiops/api-client';
import { logger } from '@veaiops/utils';
import { useCallback } from 'react';
import { updateUserPassword } from '../lib/api';
import type { ExtendedUser, UserFormData } from '../lib/types';

/**
 * usePasswordUpdate Hook 参数
 */
export interface UsePasswordUpdateParams {
  editingUser: ExtendedUser;
  onSuccess?: () => void;
}

/**
 * 密码更新逻辑 Hook
 *
 * 功能：
 * - 验证密码更新表单数据
 * - 调用密码更新 API
 * - 更新成功后自动退出登录
 */
export const usePasswordUpdate = ({
  editingUser,
  onSuccess,
}: UsePasswordUpdateParams) => {
  const { logout, isLoggingOut } = useLogout();

  const handleUpdate = useCallback(
    async (values: UserFormData): Promise<boolean> => {
      if (!editingUser || !editingUser.id) {
        Message.error('用户 ID 不能为空');
        return false;
      }

      // 验证必需字段
      if (!values.old_password || !values.new_password) {
        Message.error('旧密码和新密码不能为空');
        return false;
      }

      // UpdatePasswordRequest 类型包含 old_password, new_password, confirm_password
      const updatePasswordData: UpdatePasswordRequest = {
        old_password: values.old_password || '',
        new_password: values.new_password || '',
        confirm_password: values.confirm_password || values.new_password || '',
      };

      try {
        const success = await updateUserPassword({
          userId: editingUser.id,
          updateData: updatePasswordData,
        });

        if (success) {
          onSuccess?.();

          // 更新成功后自动退出登录
          const logoutResult = await logout({
            showMessage: true,
            redirectToLogin: true,
            onBeforeLogout: () => {
              // 空函数，用于满足 logout 接口要求
            },
          });

          if (!logoutResult.success && logoutResult.error) {
            // 退出登录失败，但不影响密码更新操作本身，仅记录警告
            logger.warn({
              message: '密码更新后退出登录失败',
              data: {
                error: logoutResult.error.message,
                stack: logoutResult.error.stack,
                errorObj: logoutResult.error,
              },
              source: 'UserDropdown',
              component: 'handleUpdate',
            });
          }
          return true;
        }
        return false;
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '更新失败，请重试';
        Message.error(errorMessage);
        return false;
      }
    },
    [editingUser, logout, onSuccess],
  );

  return {
    handleUpdate,
    isLoggingOut,
  };
};
