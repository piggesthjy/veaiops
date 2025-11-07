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
 * 账号管理辅助函数
 * @description 用户数据操作相关辅助函数（搜索、排序、过滤、导出、统计等）
 */

import type { User, UserRole, UserStatus } from '@account';
import { formatDateTime, formatLastLogin, formatUserRole, formatUserStatus } from './formatters';

/**
 * 生成随机密码
 */
export const generateRandomPassword = (length: number = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';

  // 确保包含每种类型的字符
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // 填充剩余长度
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // 打乱字符顺序
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

/**
 * searchUsers 参数接口
 */
export interface SearchUsersParams {
  users: User[];
  searchTerm: string;
}

/**
 * 搜索用户
 */
export const searchUsers = ({
  users,
  searchTerm,
}: SearchUsersParams): User[] => {
  if (!searchTerm.trim()) {
    return users;
  }

  const term = searchTerm.toLowerCase();
  return users.filter(
    (user) =>
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      formatUserRole(user.role).toLowerCase().includes(term) ||
      formatUserStatus(user.status).toLowerCase().includes(term),
  );
};

/**
 * sortUsers 参数接口
 */
export interface SortUsersParams {
  users: User[];
  sortBy: keyof User;
  order?: 'asc' | 'desc';
}

/**
 * 排序用户
 */
export const sortUsers = ({
  users,
  sortBy,
  order = 'asc',
}: SortUsersParams): User[] => {
  return [...users].sort((a, b) => {
    const aValue = a[sortBy] as string | number;
    const bValue = b[sortBy] as string | number;

    if (aValue === bValue) {
      return 0;
    }

    const comparison = aValue < bValue ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * 过滤用户
 */
export const filterUsers = (
  users: User[],
  filters: {
    role?: UserRole;
    status?: UserStatus;
    isSystemAdmin?: boolean;
  },
): User[] => {
  return users.filter((user) => {
    if (filters.role && user.role !== filters.role) {
      return false;
    }

    if (filters.status && user.status !== filters.status) {
      return false;
    }

    if (
      filters.isSystemAdmin !== undefined &&
      user.is_system_admin !== filters.isSystemAdmin
    ) {
      return false;
    }

    return true;
  });
};

/**
 * 导出用户数据为CSV
 */
export const exportUsersToCSV = (users: User[]): string => {
  const headers = [
    '用户名',
    '邮箱',
    '角色',
    '状态',
    '系统管理员',
    '最后登录',
    '创建时间',
  ];
  const rows = users.map((user) => [
    user.username,
    user.email,
    formatUserRole(user.role),
    formatUserStatus(user.status),
    user.is_system_admin ? '是' : '否',
    formatLastLogin(user.last_login),
    formatDateTime(user.created_at),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};

/**
 * 获取用户统计信息
 */
export const getUserStats = (users: User[]) => {
  const stats = {
    total: users.length,
    byRole: {
      admin: 0,
      user: 0,
      viewer: 0,
    },
    byStatus: {
      active: 0,
      inactive: 0,
      locked: 0,
    },
    systemAdmins: 0,
    recentlyActive: 0, // 最近7天登录的用户
  };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  users.forEach((user) => {
    // 按角色统计
    stats.byRole[user.role]++;

    // 按状态统计
    stats.byStatus[user.status]++;

    // 系统管理员统计
    if (user.is_system_admin) {
      stats.systemAdmins++;
    }

    // 最近活跃用户统计
    if (user.last_login && new Date(user.last_login) > sevenDaysAgo) {
      stats.recentlyActive++;
    }
  });

  return stats;
};
