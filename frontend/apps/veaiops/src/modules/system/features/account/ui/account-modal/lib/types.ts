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

import type { User, UserFormData } from '@account';
import type { FormInstance } from '@arco-design/web-react';

/**
 * 账号弹窗组件属性接口
 */
export interface AccountModalProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 正在编辑的用户，null 表示新增 */
  editingUser: User | null;
  /** 取消回调 */
  onCancel: () => void;
  /** 提交回调 */
  onSubmit: (values: UserFormData) => Promise<boolean>;
  /** Arco Design Form 实例类型 */
  form: FormInstance;
}

/**
 * 表单字段类型
 */
export type FormFieldType =
  | 'username'
  | 'email'
  | 'password'
  | 'old_password'
  | 'new_password'
  | 'role'
  | 'status';

/**
 * 表单验证规则类型
 */
export interface ValidationRule {
  required?: boolean;
  message?: string;
  minLength?: number;
  maxLength?: number;
  type?: string;
  /** Arco Design Form 验证器函数，接受值和回调函数 */
  validator?: (
    value: string | undefined,
    callback: (error?: string) => void,
  ) => void;
}
