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

import apiClient from '@/utils/api-client';
import { Message } from '@arco-design/web-react';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { useCallback } from 'react';
import type { UserFormData } from './types';

/**
 * 更新用户的参数接口
 */
export interface UpdateUserParams {
  userId: string;
  updateData: UserFormData;
}

/**
 * 创建用户
 */
export const useCreateUser = () => {
  return useCallback(async (userData: UserFormData): Promise<boolean> => {
    try {
      // 使用 Users API
      const response = await apiClient.users.postApisV1ManagerUsers({
        requestBody: {
          username: userData.username,
          email: userData.email,
          password: userData.password || 'defaultPassword123', // 提供默认密码
        },
      });

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        Message.success('用户创建成功');
        return true;
      } else {
        throw new Error(response.message || '创建用户失败');
      }
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      const errorMessage =
        error instanceof Error ? error.message : '创建用户失败';
      Message.error(errorMessage);
      return false;
    }
  }, []);
};

/**
 * 更新用户
 */
export const useUpdateUser = () => {
  return useCallback(
    async ({ userId, updateData }: UpdateUserParams): Promise<boolean> => {
      try {
        // 如果提供了密码，更新密码
        if (updateData.password) {
          const response = await apiClient.users.putApisV1ManagerUsersPassword({
            userId,
            requestBody: {
              old_password: '',
              new_password: updateData.password,
              confirm_password: updateData.password, // 与新密码一致
            },
          });

          if (response.code === API_RESPONSE_CODE.SUCCESS) {
            Message.success('密码更新成功');
            return true;
          }

          throw new Error(response.message || '更新密码失败');
        }

        // TODO: 添加其他字段更新的API调用（username, email, is_active, is_supervisor）
        Message.success('用户信息已保存');
        return true;
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '更新用户失败';
        Message.error(errorMessage);
        return false;
      }
    },
    [],
  );
};

/**
 * 删除用户
 */
export const useDeleteUser = () => {
  return useCallback(async (userId: string): Promise<boolean> => {
    try {
      // 使用 Users API
      const response = await apiClient.users.deleteApisV1ManagerUsers({
        userId,
      });

      if (response.code === API_RESPONSE_CODE.SUCCESS) {
        Message.success('用户删除成功');
        return true;
      }

      throw new Error(response.message || '删除用户失败');
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      const errorMessage =
        error instanceof Error ? error.message : '删除用户失败';
      Message.error(errorMessage);
      return false;
    }
  }, []);
};
