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

import { API_RESPONSE_CODE } from '@veaiops/constants';
import type { User, UserFormData, UserStatus } from '@account';
import type { User as ApiUser } from 'api-generate';
import apiClient from '@/utils/api-client';
import type { UpdateUserParams } from '../types';
import { transformApiUserToUser } from '../utils';

/**
 * 创建用户
 */
export const createUser = async (userData: UserFormData): Promise<User> => {
  try {
    // 使用真实API调用
    const response = await apiClient.users.postApisV1ManagerUsers({
      requestBody: {
        username: userData.username,
        email: userData.email,
        password: userData.password || 'TempPass123!', // 临时密码
      },
    });

    if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
      const apiUser = response.data;
      const result: User = transformApiUserToUser(apiUser, {
        isSupervisor: userData.is_supervisor,
      });
      return result;
    } else {
      throw new Error(response.message || '创建用户失败');
    }
  } catch (error: unknown) {
    // ✅ 正确：透出实际的错误信息
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    throw errorObj;
  }
};

/**
 * 更新用户
 */
export const updateUser = async ({
  id,
  userData,
}: UpdateUserParams): Promise<User> => {
  try {
    // 使用真实API调用
    const response = await apiClient.users.putApisV1ManagerUsers({
      userId: id,
      requestBody: {
        is_active: userData.is_active,
        is_supervisor: userData.is_supervisor,
      },
    });

    if (response.code === API_RESPONSE_CODE.SUCCESS) {
      // 由于更新接口返回的是APIResponse而不是用户数据，我们需要重新获取用户信息
      const userResponse = await apiClient.users.getApisV1ManagerUsers1({
        userId: id,
      });

      if (
        userResponse.code === API_RESPONSE_CODE.SUCCESS &&
        userResponse.data
      ) {
        const apiUser = userResponse.data;
        const result: User = transformApiUserToUser(apiUser, {
          isSupervisor: userData.is_supervisor,
        });
        return result;
      } else {
        throw new Error(
          userResponse.message || '获取更新后的用户信息失败',
        );
      }
    } else {
      throw new Error(response.message || '更新用户失败');
    }
  } catch (error: unknown) {
    // ✅ 正确：透出实际的错误信息
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    throw errorObj;
  }
};

/**
 * 删除用户
 *
 * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
 */
export const deleteUser = async (
  id: string,
): Promise<{ success: boolean; error?: Error }> => {
  try {
    // 使用真实API调用
    const response = await apiClient.users.deleteApisV1ManagerUsers({
      userId: id,
    });

    if (response.code === API_RESPONSE_CODE.SUCCESS) {
      return { success: true };
    }
    const errorObj = new Error(response.message || '删除用户失败');
    return { success: false, error: errorObj };
  } catch (error: unknown) {
    // ✅ 正确：透出实际的错误信息
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    return { success: false, error: errorObj };
  }
};
