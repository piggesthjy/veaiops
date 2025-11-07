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
import type { WebhookHeader } from './types';

/**
 * Transform Webhook header array to object
 *
 * Filters out items with empty key or value to ensure data validity
 *
 * @param webhookHeaders - Webhook header array
 * @returns Webhook header object
 *
 * @example
 * ```ts
 * convertWebhookHeaders([
 *   { key: 'Content-Type', value: 'application/json' },
 *   { key: 'Authorization', value: 'Bearer token' },
 *   { key: '', value: 'invalid' }, // Will be filtered
 * ])
 * // Returns: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' }
 * ```
 */
const convertWebhookHeaders = (
  webhookHeaders: WebhookHeader[],
): Record<string, string> => {
  const webhookHeadersObj: Record<string, string> = {};

  webhookHeaders.forEach(({ key, value }) => {
    // Only add items where both key and value are valid
    if (key && value) {
      webhookHeadersObj[key] = value;
    }
  });

  return webhookHeadersObj;
};

/**
 * Extract and format submission data from form values
 *
 * Handles various data transformations:
 * 1. Transform time range to ISO string
 * 2. Normalize strategy IDs to string array
 * 3. Handle Webhook configuration
 * 4. Handle event levels
 *
 * @param values - Form values
 * @param webhookHeaders - Webhook header configuration
 * @param enableWebhook - Whether to enable Webhook
 * @returns Formatted submission data
 */
const formatSubmitData = (
  values: Record<string, any>,
  webhookHeaders: WebhookHeader[],
  enableWebhook: boolean,
): SubscribeRelationCreate | SubscribeRelationUpdate => {
  // Convert time range from local timezone to UTC ISO 8601 format
  // ✅ Fix: convertLocalTimeRangeToUtc now handles both Date[] and string[] automatically

  // Validate time range exists (required field)
  if (
    !values.effective_time_range ||
    !Array.isArray(values.effective_time_range) ||
    values.effective_time_range.length !== 2
  ) {
    throw new Error('生效时间范围是必填字段');
  }

  const utcRange = convertLocalTimeRangeToUtc(values.effective_time_range);
  if (!utcRange) {
    throw new Error('时间范围转换失败，请重新选择');
  }

  const [start_time, end_time] = utcRange;

  // Handle Webhook headers
  const webhookHeadersObj = enableWebhook
    ? convertWebhookHeaders(webhookHeaders)
    : {};

  // Normalize strategy IDs
  const normalizedStrategyIds = ensureArray(values.inform_strategy_ids)
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0);

  // Normalize event levels: transform frontend form's event_levels to backend's event_level
  // ✅ Fix: event_level is a required backend field, empty array means subscribe to all levels
  // Backend definition: event_level: List[EventLevel] = Field(...) - required field
  const normalizedEventLevel = Array.isArray(values.event_levels)
    ? values.event_levels
    : [];

  // ✅ Fix: Return type conforms to SubscribeRelationCreate | SubscribeRelationUpdate
  // Ensure required fields are not undefined
  // ✅ Fix: Field name unified to use enable_webhook (consistent with backend definition)
  // ✅ Fix: inform_strategy_ids always passes array (even if empty), not undefined
  return {
    name: values.name,
    agent_type: values.agent_type,
    inform_strategy_ids: normalizedStrategyIds,
    start_time,
    end_time,
    event_level: normalizedEventLevel,
    enable_webhook: enableWebhook || undefined,
    webhook_endpoint: enableWebhook ? values.webhook_endpoint : undefined,
    webhook_headers:
      enableWebhook && Object.keys(webhookHeadersObj).length > 0
        ? webhookHeadersObj
        : undefined,
    interest_products: values.interest_products || undefined,
    interest_projects: values.interest_projects || undefined,
    interest_customers: values.interest_customers || undefined,
  };
};

/**
 * Create form submission handler function
 *
 * Encapsulates complete form submission flow:
 * 1. Validate form
 * 2. Format data
 * 3. Call submission callback
 * 4. Determine success/failure based on return value
 * 5. Display corresponding notification
 * 6. Call onCancel to close form on success
 *
 * @param form - Form instance
 * @param setLoading - Function to set loading state
 * @returns Submission handler function, returns Promise<boolean> indicating submission success
 *
 * @example
 * ```ts
 * const handleSubmit = createSubmitHandler(form, setLoading);
 *
 * const success = await handleSubmit(
 *   async (data) => {
 *     // Execute save logic
 *     return true; // Return true for success, false for failure
 *   },
 *   () => {
 *     // Callback to close modal after success
 *   },
 *   webhookHeaders,
 *   enableWebhook
 * );
 *
 * if (success) {
 *   // Submission successful
 * }
 * ```
 */
export const createSubmitHandler = (
  form: FormInstance,
  setLoading: (loading: boolean) => void,
) => {
  return async (
    onSubmit: (
      data: SubscribeRelationCreate | SubscribeRelationUpdate,
    ) => Promise<boolean>,
    onCancel: () => void,
    webhookHeaders: WebhookHeader[],
    enableWebhook: boolean,
  ): Promise<boolean> => {
    try {
      // Validate form
      const values = await form.validate();
      setLoading(true);

      // Format submission data
      const submitData = formatSubmitData(
        values,
        webhookHeaders,
        enableWebhook,
      );

      // Call submission callback, get result
      const success = await onSubmit(submitData);

      // Determine success based on return value
      if (success) {
        onCancel();
        return true;
      }

      Message.error('订阅保存失败，请重试');
      return false;
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || '提交失败，请检查表单数据';

      // ✅ 正确：使用 logger 记录错误，透出实际错误信息
      logger.error({
        message: '订阅表单提交失败',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'SubscriptionForm',
        component: 'createSubmitHandler',
      });

      Message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };
};
