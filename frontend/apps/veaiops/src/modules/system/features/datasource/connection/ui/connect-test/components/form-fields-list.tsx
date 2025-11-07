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

import type React from 'react';
import { FORM_FIELD_CONFIGS } from './config';
import { FormField } from './form-field';
import type { FormFieldsListProps } from './types';

/**
 * 表单字段列表组件
 * 根据连接类型渲染对应的表单字段
 */
export const FormFieldsList: React.FC<FormFieldsListProps> = ({
  connectType,
  connect,
  disabledFields = [],
}) => {
  const fieldConfigs = FORM_FIELD_CONFIGS[connectType] || [];

  return (
    <>
      {fieldConfigs.map((config) => {
        const isDisabled = disabledFields.includes(config.field);
        // 密码字段不预填充，始终为空，让用户手动输入
        let initialValue: string | undefined;
        if (config.isPassword) {
          initialValue = undefined;
        } else if (
          connect &&
          typeof connect === 'object' &&
          config.field in connect
        ) {
          // ✅ 修复：使用类型守卫安全地访问动态字段
          // Connect 类型包含 Record<string, unknown> 索引签名，可以安全访问任意字段
          // 使用类型检查确保字段值类型正确
          const fieldValue = (connect as Record<string, unknown>)[config.field];
          initialValue =
            typeof fieldValue === 'string' ? fieldValue : undefined;
        } else {
          initialValue = undefined;
        }

        return (
          <FormField
            key={config.field}
            config={config}
            disabled={isDisabled}
            initialValue={initialValue}
          />
        );
      })}
    </>
  );
};
