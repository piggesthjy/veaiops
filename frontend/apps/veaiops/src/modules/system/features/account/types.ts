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

// 直接使用API生成的User类型
import type { FormInstance } from '@arco-design/web-react';
import type { User as ApiUser } from 'api-generate';

/**
 * 用户角色类型
 */
export type UserRole = 'admin' | 'user' | 'viewer';

/**
 * 用户状态类型
 */
export type UserStatus = 'active' | 'inactive' | 'locked';

/**
 * 扩展的用户类型，包含本地需要的字段
 */
export interface User extends Omit<ApiUser, '_id'> {
  id: string; // 映射 _id 到 id
  role: UserRole;
  status: UserStatus;
  is_system_admin: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 用户表单数据接口
 */
export interface UserFormData {
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 密码 */
  password?: string;
  /** 旧密码（修改密码时使用） */
  old_password?: string;
  /** 新密码（修改密码时使用） */
  new_password?: string;
  /** 确认新密码（修改密码时使用） */
  confirm_password?: string;
  /** 是否激活 */
  is_active?: boolean;
  /** 是否为管理员 */
  is_supervisor?: boolean;
}

/**
 * 用户表格数据类型
 */
export type UserTableData = User;

/**
 * 用户表格组件属性接口
 */
export interface UserTableProps {
  onEdit: (user: User) => void;
  onDelete: (userId: string) => Promise<boolean>;
  onAdd: () => void;
}

/**
 * 用户弹窗组件属性接口
 */

export interface UserModalProps {
  visible: boolean;
  editingUser: User | null;
  onCancel: () => void;
  onSubmit: (values: UserFormData) => Promise<boolean>;
  /** Arco Design Form 实例类型 */
  form: FormInstance;
}
