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
 * 密码输入表单组件
 */

import { Form } from '@arco-design/web-react';
import { logger } from '@veaiops/utils';
import type { DataSourceType } from 'api-generate';
import { forwardRef, useImperativeHandle } from 'react';
import { FormActions } from './form-actions';
import { FormFieldsList } from './form-fields-list';
import type { PasswordFormProps, PasswordFormRef } from './types';

export const PasswordForm = forwardRef<PasswordFormRef, PasswordFormProps>(
  (
    {
      connectType,
      connect,
      onSubmit,
      onCancel,
      loading = false,
      showButtons = true,
    },
    ref,
  ) => {
    const [form] = Form.useForm();

    // 根据连接类型确定需要禁用的字段（除了密码/Secret字段）
    const getDisabledFields = (type: DataSourceType): string[] => {
      switch (type) {
        case 'Zabbix':
          return ['zabbix_api_url', 'zabbix_api_user']; // 禁用URL和用户名，保留密码可编辑
        case 'Aliyun':
          return ['aliyun_access_key_id']; // 禁用Access Key ID，保留Secret可编辑
        case 'Volcengine':
          return ['volcengine_access_key_id']; // 禁用Access Key ID，保留Secret可编辑
        default:
          return [];
      }
    };

    const disabledFields = getDisabledFields(connectType);

    const handleSubmit = async () => {
      try {
        const values = await form.validate();
        onSubmit(values);
      } catch (error: unknown) {
        // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: '[PasswordForm] 表单验证失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
            timestamp: Date.now(),
          },
          source: 'PasswordForm',
          component: 'handleSubmit',
        });
      }
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <div className="py-4">
        <div className="mb-4 text-[#666]">输入连接所需的认证信息</div>

        <Form form={form} layout="vertical" autoComplete="off">
          <FormFieldsList
            connectType={connectType}
            connect={connect}
            disabledFields={disabledFields}
          />
        </Form>

        {showButtons && (
          <FormActions
            onSubmit={handleSubmit}
            onCancel={onCancel}
            loading={loading}
          />
        )}
      </div>
    );
  },
);
