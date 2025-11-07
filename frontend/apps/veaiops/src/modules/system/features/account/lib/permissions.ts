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
 * 账号管理权限检查函数
 * @description 用户权限验证相关函数
 */

import type { User, UserRole } from '@account';
import { USER_PERMISSIONS } from './constants';

/**
 * 检查用户权限
 */
export const checkUserPermission = (
  currentUserRole: UserRole,
  targetUser: User,
  action: keyof typeof USER_PERMISSIONS.admin,
): boolean => {
  const permissions = USER_PERMISSIONS[currentUserRole];

  if (!permissions) {
    return false;
  }

  // 检查基础权限
  if (!permissions[action]) {
    return false;
  }

  // 系统管理员不能被其他用户操作（除了其他系统管理员）
  if (targetUser.is_system_admin && currentUserRole !== 'admin') {
    return false;
  }

  // 用户不能操作比自己权限高的用户
  const roleHierarchy = { viewer: 0, user: 1, admin: 2 };
  const currentLevel = roleHierarchy[currentUserRole];
  const targetLevel = roleHierarchy[targetUser.role];

  if (targetLevel > currentLevel) {
    return false;
  }

  return true;
};
