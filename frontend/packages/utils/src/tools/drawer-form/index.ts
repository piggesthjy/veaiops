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

import type { FormInstance } from '@arco-design/web-react';
import { useCallback, useState } from 'react';

import { logger } from '../logger';

/**
 * 抽屉表单提交配置选项
 */
export interface UseDrawerFormSubmitOptions<T = Record<string, unknown>> {
  /**
   * 表单实例
   */
  form: FormInstance;

  /**
   * 提交处理函数
   * @param values - 表单验证通过后的值
   * @returns Promise<boolean> - 返回 true 表示成功，false 表示失败
   */
  onSubmit: (values: T) => Promise<boolean>;

  /**
   * 提交成功后的回调
   * @param values - 表单值
   */
  onSuccess?: (values: T) => void;

  /**
   * 提交失败后的回调
   * @param error - 错误对象
   */
  onError?: (error: unknown) => void;

  /**
   * 是否在成功后重置表单
   * @default true
   */
  resetOnSuccess?: boolean;

  /**
   * 是否在成功后关闭抽屉
   * @default false
   */
  closeOnSuccess?: boolean;

  /**
   * 关闭抽屉的回调（仅在 closeOnSuccess 为 true 时使用）
   */
  onClose?: () => void;
}

/**
 * 抽屉表单提交返回值
 */
export interface UseDrawerFormSubmitReturn {
  /**
   * 提交中状态
   */
  submitting: boolean;

  /**
   * 提交处理函数
   */
  handleSubmit: () => Promise<void>;

  /**
   * 手动设置提交状态（用于外部控制）
   */
  setSubmitting: (loading: boolean) => void;
}

/**
 * 抽屉表单提交 Hook
 *
 * 封装抽屉表单的提交逻辑，包括：
 * 1. 表单验证
 * 2. Loading 状态管理
 * 3. 错误处理
 * 4. 成功后的回调处理
 *
 * @example
 * ```tsx
 * const { submitting, handleSubmit } = useDrawerFormSubmit({
 *   form,
 *   onSubmit: async (values) => {
 *     const success = await api.createProject(values);
 *     return success;
 *   },
 *   onSuccess: () => {
 *     Message.success('创建成功');
 *   },
 *   resetOnSuccess: true,
 *   closeOnSuccess: true,
 *   onClose: handleClose,
 * });
 *
 * // 在抽屉中使用
 * <Drawer
 *   footer={
 *     <Button onClick={handleSubmit} loading={submitting}>
 *       提交
 *     </Button>
 *   }
 * >
 *   <DrawerFormContent loading={submitting}>
 *     <Form form={form}>...</Form>
 *   </DrawerFormContent>
 * </Drawer>
 * ```
 */
export const useDrawerFormSubmit = <T = Record<string, unknown>>({
  form,
  onSubmit,
  onSuccess,
  onError,
  resetOnSuccess = true,
  closeOnSuccess = false,
  onClose,
}: UseDrawerFormSubmitOptions<T>): UseDrawerFormSubmitReturn => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    try {
      // 步骤 1: 验证表单
      const values = await form.validate();

      // 步骤 2: 开始提交，设置 loading 状态
      setSubmitting(true);

      // 步骤 3: 调用提交函数
      const success = await onSubmit(values as T);

      // 步骤 4: 处理成功情况
      if (success) {
        // 执行成功回调
        if (onSuccess) {
          onSuccess(values as T);
        }

        // 重置表单（如果需要）
        if (resetOnSuccess) {
          form.resetFields();
        }

        // 关闭抽屉（如果需要）
        if (closeOnSuccess && onClose) {
          onClose();
        }
      }
    } catch (error: unknown) {
      // 处理错误情况
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      // 如果是表单验证错误，不记录日志（表单会自动显示错误信息）
      if (
        errorObj.message &&
        (errorObj.message.includes('validation') ||
          errorObj.message.includes('验证') ||
          errorObj.message.includes('required'))
      ) {
        // 表单验证失败，静默处理（表单会自动显示错误）
        return;
      }

      // 其他错误，记录日志并调用错误回调
      logger.error({
        message: '抽屉表单提交失败',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'useDrawerFormSubmit',
        component: 'handleSubmit',
      });

      // 调用错误回调
      if (onError) {
        onError(error);
      }
    } finally {
      // 步骤 5: 无论成功还是失败，都要停止 loading
      setSubmitting(false);
    }
  }, [
    form,
    onSubmit,
    onSuccess,
    onError,
    resetOnSuccess,
    closeOnSuccess,
    onClose,
  ]);

  return {
    submitting,
    handleSubmit,
    setSubmitting,
  };
};

// 导出组件
export { DrawerFormContent } from './content';
export type { DrawerFormContentProps } from './content';
