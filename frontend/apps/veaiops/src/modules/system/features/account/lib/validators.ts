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
 * 账号管理验证函数
 * @description 用户表单数据验证相关函数
 */

import type { UserFormData } from '@account';
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from './validation-helpers';

/**
 * 验证表单数据
 */
export const validateUserFormData = (
  data: UserFormData,
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // 验证用户名
  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.valid) {
    errors.username = usernameValidation.error!;
  }

  // 验证邮箱
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error!;
  }

  // 验证密码（仅在提供密码时）
  if (data.password) {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.error!;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
