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
 * 重置用户密码
 *
 * @returns 返回 { success: boolean; error?: Error; data?: string } 格式的结果对象
 */
export const resetUserPassword = async (
  id: string,
  newPassword?: string,
): Promise<{ success: boolean; error?: Error; data?: string }> => {
  try {
    // TODO: 需要后端提供管理员重置用户密码的API接口
    // 当前的 /apis/v1/manager/users/{user_id}/password 接口需要旧密码，不适用于管理员重置
    // const response = await apiClient.users.putApisV1ManagerUsersPassword({...});

    // 临时返回生成的密码
    const generatedPassword = newPassword || 'TempPass123!';

    return { success: true, data: generatedPassword };
  } catch (error: unknown) {
    // ✅ 正确：透出实际的错误信息
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    return { success: false, error: errorObj };
  }
};

/**
 * 锁定用户
 *
 * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
 */
export const lockUser = async (
  _id: string,
): Promise<{ success: boolean; error?: Error }> => {
  try {
    // TODO: 替换为实际的API调用
    // await apiClient.post(`/api/users/${id}/lock`);

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true };
  } catch (error: unknown) {
    // ✅ 正确：透出实际的错误信息
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    return { success: false, error: errorObj };
  }
};

/**
 * 解锁用户
 *
 * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
 */
export const unlockUser = async (
  _id: string,
): Promise<{ success: boolean; error?: Error }> => {
  try {
    // TODO: 替换为实际的API调用
    // await apiClient.post(`/api/users/${id}/unlock`);

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true };
  } catch (error: unknown) {
    // ✅ 正确：透出实际的错误信息
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    return { success: false, error: errorObj };
  }
};

/**
 * 批量删除用户
 *
 * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
 */
export const batchDeleteUsers = async (
  _ids: string[],
): Promise<{ success: boolean; error?: Error }> => {
  try {
    // TODO: 替换为实际的API调用
    // await apiClient.post('/api/users/batch-delete', { ids });

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
  } catch (error: unknown) {
    // ✅ 正确：透出实际的错误信息
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    return { success: false, error: errorObj };
  }
};
