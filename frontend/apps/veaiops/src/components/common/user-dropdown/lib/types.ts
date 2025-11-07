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

import type { User } from '@veaiops/api-client';

/**
 * 用户表单数据（用于密码修改表单）
 *
 * 为什么自定义：
 * - 用于表单验证和UI交互，扩展了 API 生成的 UpdatePasswordRequest 类型
 * - 包含前端特有的表单字段（如 confirm_password 用于前端验证）
 *
 * 对应 API 类型：UpdatePasswordRequest (from @veaiops/api-client)
 */
export interface UserFormData {
  old_password?: string;
  new_password?: string;
  confirm_password?: string;
}

/**
 * 扩展的用户类型（包含前端额外字段）
 *
 * 为什么扩展：
 * - 前端需要 id 字段（从 _id 映射）和 role 字段（从 is_supervisor 派生）
 * - 用于本地存储和UI展示
 */
export type ExtendedUser = Partial<User> & {
  id?: string;
  role?: string;
};
