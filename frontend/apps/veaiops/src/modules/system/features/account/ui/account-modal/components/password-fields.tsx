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

import { Form, Input, Space } from '@arco-design/web-react';
import { IconInfoCircleFill, IconLock } from '@arco-design/web-react/icon';
import type React from 'react';
import { useState } from 'react';
import type { ValidationRule } from '../lib';
import { PasswordStrengthIndicator } from './password-strength-indicator';

const { Password } = Input;

/**
 * 密码字段组件 Props
 */
interface PasswordFieldsProps {
  /** 是否为编辑模式（修改密码） */
  isEditing: boolean;
  /** 旧密码验证规则 */
  passwordRules: ValidationRule[];
  /** 新密码验证规则 */
  newPasswordRules: ValidationRule[];
}

/**
 * 密码字段组件
 * 根据是否编辑模式显示不同的密码字段
 */
export const PasswordFields: React.FC<PasswordFieldsProps> = ({
  isEditing,
  passwordRules,
  newPasswordRules,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [createPassword, setCreatePassword] = useState('');

  if (isEditing) {
    // 修改密码模式
    return (
      <div className="space-y-4">
        {/* 旧密码字段 */}
        <Form.Item
          label={
            <Space size={4}>
              <IconLock className="text-gray-500" />
              <span>旧密码</span>
            </Space>
          }
          field="old_password"
          disabled={false}
          rules={passwordRules}
        >
          <Password
            placeholder="请输入当前密码"
            autoComplete="current-password"
            prefix={<IconLock className="text-gray-400" />}
            size="large"
          />
        </Form.Item>

        {/* 身份验证说明 */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <IconInfoCircleFill className="text-blue-500 text-sm mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <div className="font-medium mb-1">身份验证说明</div>
              <div>为了保护您的账号安全，修改密码前需要验证当前登录密码</div>
            </div>
          </div>
        </div>

        {/* 新密码字段 */}
        <Form.Item
          label={
            <Space size={4}>
              <IconLock className="text-gray-500" />
              <span>新密码</span>
            </Space>
          }
          field="new_password"
          disabled={false}
          rules={newPasswordRules}
        >
          <Password
            placeholder="请输入新密码（至少6个字符）"
            autoComplete="new-password"
            prefix={<IconLock className="text-gray-400" />}
            size="large"
            onChange={(value) => {
              setNewPassword(value);
            }}
          />
        </Form.Item>

        <PasswordStrengthIndicator password={newPassword} />
      </div>
    );
  }

  // 新增账号模式
  return (
    <>
      <Form.Item
        label={
          <Space size={4}>
            <IconLock className="text-gray-500" />
            <span>密码</span>
          </Space>
        }
        field="password"
        rules={passwordRules}
      >
        <Password
          placeholder="请设置登录密码（至少6个字符）"
          autoComplete="new-password"
          prefix={<IconLock className="text-gray-400" />}
          size="large"
          onChange={(value) => {
            setCreatePassword(value);
          }}
        />
      </Form.Item>

      <PasswordStrengthIndicator password={createPassword} />
    </>
  );
};
