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
 * 连接创建/编辑表单组件
 */

import { getDataSourceDisplayName } from '@/utils/data-source-utils';
import {
  Alert,
  Button,
  Form,
  Input,
  Space,
  Switch,
} from '@arco-design/web-react';
import { IconClose, IconSave } from '@arco-design/web-react/icon';
import { DataSourceType } from 'api-generate';
import type React from 'react';
// 使用从lib/types导入的ConnectFormProps类型
import type { ConnectFormProps } from '../../../connection/lib';
import { useConnectionTestLogic } from '../../hooks/use-connection-test-logic';
import { useFormSubmission } from '../../hooks/use-form-submission';
import { ConnectTestModal } from '../connect-test/connect-test-modal';
import { AliyunCredentialsForm } from './aliyun-credentials-form';
import { VolcengineCredentialsForm } from './volcengine-credentials-form';
import { ZabbixCredentialsForm } from './zabbix-credentials-form';

export const ConnectForm: React.FC<ConnectFormProps> = ({
  type,
  initialValues,
  onSubmit,
  onCancel,
  form,
}) => {
  const { testResult, handleTestConnection } = useConnectionTestLogic({ type });

  const {
    submitting,
    testModalVisible,
    testConnectionData,
    externalTestResult,
    handleSubmit,
    handleTestModalClose,
  } = useFormSubmission({
    type,
    initialValues,
    onSubmit,
  });

  // 渲染认证字段
  const renderCredentialFields = () => {
    switch (type) {
      case DataSourceType.ZABBIX:
        return <ZabbixCredentialsForm />;
      case DataSourceType.ALIYUN:
        return <AliyunCredentialsForm />;
      case DataSourceType.VOLCENGINE:
        return <VolcengineCredentialsForm />;
      default:
        return null;
    }
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          is_active: true,
          ...initialValues,
        }}
      >
        {/* 基础信息 */}
        <Form.Item
          label="连接名称"
          field="name"
          rules={[
            { required: true, message: '请输入连接名称' },
            { minLength: 2, message: '连接名称至少2个字符' },
            { maxLength: 50, message: '连接名称不能超过50个字符' },
          ]}
        >
          <Input
            placeholder={`请输入${getDataSourceDisplayName(type)}连接名称`}
            allowClear
            disabled={Boolean(initialValues)}
          />
        </Form.Item>

        {/* 启用状态字段 - 隐藏但保留数据 */}
        <Form.Item field="is_active" style={{ display: 'none' }}>
          <Switch checkedText="启用" uncheckedText="禁用" />
        </Form.Item>

        {/* 认证信息 */}
        {renderCredentialFields()}

        {/* 连接测试结果 */}
        {testResult && (
          <Alert
            type={testResult.success ? 'success' : 'error'}
            content={testResult.message}
            className="mb-4"
          />
        )}

        {/* 操作按钮 */}
        <div className="flex justify-between mt-6">
          <Button
            onClick={() => handleTestConnection(form.getFieldsValue())}
            disabled={submitting}
          >
            测试连接
          </Button>
          <Space>
            <Button onClick={onCancel} icon={<IconClose />}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => handleSubmit(form)}
              loading={submitting}
              icon={<IconSave />}
            >
              {initialValues ? '更新' : '创建'}
            </Button>
          </Space>
        </div>
      </Form>

      {/* 连接测试弹窗 */}
      <ConnectTestModal
        visible={testModalVisible}
        connect={testConnectionData}
        onClose={handleTestModalClose}
        externalTestResult={externalTestResult}
        externalTesting={submitting}
      />
    </>
  );
};
