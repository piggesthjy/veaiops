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
import { Message } from '@arco-design/web-react';
import {
  convertLocalTimeRangeToUtc,
  ensureArray,
  logger,
} from '@veaiops/utils';
import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
} from 'api-generate';
import { useCallback, useState } from 'react';

/**
 * Subscription relation form submit Hook parameter interface
 */
export interface UseRelationFormSubmitParams {
  form: FormInstance;
  onSubmit: (
    data: SubscribeRelationCreate | SubscribeRelationUpdate,
  ) => Promise<boolean>;
  onSuccess?: () => void;
}

/**
 * Subscription relation form submit Hook
 * Handles form submission logic, including data transformation and error handling
 */
export const useRelationFormSubmit = ({
  form,
  onSubmit,
  onSuccess,
}: UseRelationFormSubmitParams) => {
  const [loading, setLoading] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validate();
      setLoading(true);

      // Convert time range from local timezone to UTC ISO 8601 format
      let start_time: string | undefined;
      let end_time: string | undefined;
      if (
        values.timeRange &&
        Array.isArray(values.timeRange) &&
        values.timeRange.length === 2
      ) {
        const utcRange = convertLocalTimeRangeToUtc(values.timeRange);
        if (utcRange) {
          [start_time, end_time] = utcRange;
        } else {
          Message.error('时间范围转换失败，请重新选择');
          setLoading(false);
          return;
        }
      }
      let webhookHeaders = {};
      if (values.enable_webhook && values.webhook_headers) {
        try {
          webhookHeaders = JSON.parse(values.webhook_headers);
        } catch (error: unknown) {
          // ✅ Correct: Expose actual error information
          const errorObj =
            error instanceof Error ? error : new Error(String(error));
          const errorMessage =
            errorObj.message || 'Webhook请求头不是有效的JSON格式';
          Message.error(errorMessage);
          setLoading(false);
          return;
        }
      }

      // ✅ Fix: Normalize strategy IDs, always pass array (even if empty)
      const normalizedStrategyIds = ensureArray(
        (values as Record<string, unknown>)?.inform_strategy_ids,
      )
        .map(String)
        .filter(Boolean);

      const formData: SubscribeRelationCreate | SubscribeRelationUpdate = {
        ...values,
        // Map UI field to API field to avoid browser autofill on "name"
        name:
          (values as Record<string, unknown>)?.subscribeName ??
          (values as Record<string, unknown>)?.name,
        // ✅ Fix: inform_strategy_ids always passes array (even if empty), not undefined
        inform_strategy_ids: normalizedStrategyIds,
        start_time,
        end_time,
        webhook_headers: webhookHeaders,
      };

      const success = await onSubmit(formData);
      if (success) {
        form.resetFields();
        Message.success('事件订阅创建成功');
        onSuccess?.();
      }
    } catch (error: unknown) {
      // ✅ Note: Error has been handled in Hook, silent handling here is expected behavior
      // Use logger to record debug information (logger internally handles development environment check)
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.debug({
        message: '表单提交错误（已在 Hook 中处理）',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'SubscribeRelationForm',
        component: 'handleSubmit',
      });
    } finally {
      setLoading(false);
    }
  }, [form, onSubmit, onSuccess]);

  return {
    loading,
    handleSubmit,
  };
};
