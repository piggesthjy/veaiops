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

import type { ValidationRule } from './types';

/**
 * 密码验证器
 *
 * @param value - 待验证的密码值
 * @param callback - Arco Design Form 的验证回调函数，接受可选的错误消息字符串
 */
const passwordValidator = (
  value: string | undefined,
  callback: (error?: string) => void,
) => {
  if (!value) {
    callback('密码不能为空');
    return;
  }
  // const validation = validateBasicPassword(value);
  // if (!validation.valid) {
  //   callback(validation.error);
  // } else {
  //   callback();
  // }
  // 暂时使用简单验证
  if (value && value.length < 6) {
    callback('密码长度不能少于6位');
  } else {
    callback();
  }
};

/**
 * 用户名验证器
 *
 * @param value - 待验证的用户名
 * @param callback - Arco Design Form 的验证回调函数，接受可选的错误消息字符串
 */
const usernameValidator = (
  value: string | undefined,
  callback: (error?: string) => void,
) => {
  if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
    callback('用户名只能包含字母、数字和下划线');
  } else {
    callback();
  }
};

/**
 * 统一的密码校验规则 - 与登录时的校验逻辑保持一致
 */
export const passwordRules: ValidationRule[] = [
  { required: true, message: '请输入密码' },
  { validator: passwordValidator },
];

/**
 * 新密码的校验规则 - 使用基础密码校验
 */
export const newPasswordRules: ValidationRule[] = [
  { required: true, message: '请输入密码' },
  { validator: passwordValidator },
];

/**
 * 用户名校验规则
 */
export const usernameRules: ValidationRule[] = [
  { required: true, message: '请输入用户名' },
  { minLength: 3, message: '用户名至少3个字符' },
  { maxLength: 20, message: '用户名不能超过20个字符' },
  { validator: usernameValidator },
];

/**
 * 邮箱校验规则
 */
export const emailRules: ValidationRule[] = [
  { required: true, message: '请输入邮箱' },
  { type: 'email', message: '请输入有效的邮箱地址' },
];

/**
 * 角色校验规则
 */
export const roleRules: ValidationRule[] = [
  { required: true, message: '请选择角色' },
];

/**
 * 状态校验规则
 */
export const statusRules: ValidationRule[] = [
  { required: true, message: '请选择状态' },
];
