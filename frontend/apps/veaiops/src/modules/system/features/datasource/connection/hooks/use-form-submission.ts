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
 * 表单提交逻辑Hook
 */

import { Message } from '@arco-design/web-react';
import type { DataSourceType } from 'api-generate';
import { useCallback, useState } from 'react';
import { useConnectionTestLogic } from './use-connection-test-logic';

interface UseFormSubmissionProps {
  type: DataSourceType;
  initialValues?: any;
  onSubmit: (values: any) => Promise<boolean>;
  onTestFailure?: (error: string) => void;
}

export const useFormSubmission = ({
  type,
  initialValues,
  onSubmit,
  onTestFailure,
}: UseFormSubmissionProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testError, setTestError] = useState<string>('');
  const [testConnectionData, setTestConnectionData] = useState<any>(null);
  const [externalTestResult, setExternalTestResult] = useState<any>(null);

  const { executeConnectionTest, validatePassword, clearResult } =
    useConnectionTestLogic({ type });

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback(
    async (form: any): Promise<boolean> => {
      try {
        const values = await form.validate();

        // 在编辑模式下，确保包含连接名称（即使字段被disabled）
        if (initialValues?.name && !values.name) {
          values.name = initialValues.name;
        }

        setSubmitting(true);

        // 检查密码是否已填写
        const missingField = validatePassword(values);
        if (missingField) {
          Message.error(`请输入${missingField}`);
          return false;
        }

        // 提交前测试连接
        Message.info('正在测试连接...');

        // 执行测试连接
        const testResult = await executeConnectionTest(values);

        if (!testResult.success) {
          // 清除页面顶部的错误横幅，避免重复显示
          clearResult();
          // 显示测试失败弹窗，阻断后续提交
          const errorMessage =
            testResult.message || '连接测试失败，请检查配置后重试';
          setTestError(errorMessage);
          setTestConnectionData({
            _id: initialValues?._id || 'temp',
            name: values.name,
            type,
            is_active: values.is_active ?? true,
            ...values,
          });
          setExternalTestResult(testResult);
          setTestModalVisible(true);
          onTestFailure?.(errorMessage);
          return false;
        }

        Message.success('连接测试成功，正在提交...');

        // 提交数据
        const success = await onSubmit(values);
        return success;
      } catch (error: unknown) {
        // ✅ 正确：透出实际错误信息
        // 表单验证失败或测试连接失败
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMsg = errorObj.message || '操作失败';
        Message.error(errorMsg);
        logger.error({
          message: '连接表单提交失败',
          data: {
            error: errorMsg,
            stack: errorObj.stack,
            errorObj,
            type,
          },
          source: 'useFormSubmission',
          component: 'handleSubmit',
        });
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [
      type,
      initialValues,
      validatePassword,
      executeConnectionTest,
      clearResult,
      onSubmit,
      onTestFailure,
    ],
  );

  /**
   * 关闭测试失败弹窗
   */
  const handleTestModalClose = useCallback(() => {
    setTestModalVisible(false);
    setTestError('');
    setTestConnectionData(null);
    setExternalTestResult(null);
  }, []);

  return {
    submitting,
    testModalVisible,
    testError,
    testConnectionData,
    externalTestResult,
    handleSubmit,
    handleTestModalClose,
  };
};
