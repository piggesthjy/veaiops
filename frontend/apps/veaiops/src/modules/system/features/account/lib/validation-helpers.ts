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
 * 账号管理验证辅助函数
 * @description 基础验证函数（用户名、邮箱、密码等）
 */

/**
 * 验证用户名格式
 */
export const validateUsername = (
  username: string,
): { valid: boolean; error?: string } => {
  if (!username) {
    return { valid: false, error: '用户名不能为空' };
  }

  if (username.length < 3) {
    return { valid: false, error: '用户名至少3个字符' };
  }

  if (username.length > 20) {
    return { valid: false, error: '用户名最多20个字符' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: '用户名只能包含字母、数字、下划线和中划线' };
  }

  return { valid: true };
};

/**
 * 验证邮箱格式
 */
export const validateEmail = (
  email: string,
): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: '邮箱不能为空' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: '邮箱格式不正确' };
  }

  return { valid: true };
};

/**
 * 验证密码强度
 */
export const validatePassword = (
  password: string,
): {
  valid: boolean;
  error?: string;
  strength: 'weak' | 'medium' | 'strong';
} => {
  if (!password) {
    return { valid: false, error: '密码不能为空', strength: 'weak' };
  }

  if (password.length < 8) {
    return { valid: false, error: '密码至少8个字符', strength: 'weak' };
  }

  if (password.length > 32) {
    return { valid: false, error: '密码最多32个字符', strength: 'weak' };
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  // 检查包含小写字母
  if (/[a-z]/.test(password)) {
    score++;
  }

  // 检查包含大写字母
  if (/[A-Z]/.test(password)) {
    score++;
  }

  // 检查包含数字
  if (/\d/.test(password)) {
    score++;
  }

  // 检查包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  }

  // 检查长度
  if (password.length >= 12) {
    score++;
  }

  if (score >= 4) {
    strength = 'strong';
  } else if (score >= 2) {
    strength = 'medium';
  }

  return { valid: true, strength };
};

/**
 * 基础密码校验 - 与登录时的校验逻辑保持一致
 * 用于旧密码校验，只要求基本的长度限制
 */
export const validateBasicPassword = (
  password: string,
): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: '密码不能为空' };
  }

  if (password.length < 6) {
    return { valid: false, error: '密码至少6个字符' };
  }

  if (password.length > 32) {
    return { valid: false, error: '密码最多32个字符' };
  }

  return { valid: true };
};

/**
 * 复杂密码校验 - 用于新密码设置
 * 只要求基本的长度限制，不强制要求大小写字母和特殊字符
 */
export const validateComplexPassword = (
  password: string,
): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: '密码不能为空' };
  }

  if (password.length < 6) {
    return { valid: false, error: '密码至少6个字符' };
  }

  if (password.length > 32) {
    return { valid: false, error: '密码最多32个字符' };
  }

  return { valid: true };
};
