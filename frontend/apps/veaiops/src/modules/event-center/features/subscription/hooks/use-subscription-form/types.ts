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

import type { ModuleType } from '@/types/module';
import type { FormInstance } from '@arco-design/web-react';
import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
  SubscribeRelationWithAttributes,
} from 'api-generate';

/**
 * 策略ID类型：可能是字符串、数字或包含id的对象
 */
export type StrategyIdItem =
  | string
  | number
  | { id?: string | number }
  | null
  | undefined;

/**
 * Webhook请求头配置
 */
export interface WebhookHeader {
  key: string;
  value: string;
}

/**
 * 表单管理Hook的配置参数
 */
export interface UseSubscriptionFormConfig {
  /** 表单是否可见 */
  visible: boolean;
  /** 初始数据（编辑模式） */
  initialData?: SubscribeRelationWithAttributes | null;
  /** 模块类型 */
  moduleType?: ModuleType;
}

/**
 * 表单管理Hook的返回值
 */
export interface UseSubscriptionFormReturn {
  /** 表单实例 */
  form: FormInstance;
  /** 提交加载状态 */
  loading: boolean;
  /**
   * 提交处理函数
   * @param onSubmit - 提交回调函数，返回 true 表示成功，false 表示失败
   * @param onCancel - 取消回调函数，成功时会被调用
   * @param webhookHeaders - Webhook请求头配置
   * @param enableWebhook - 是否启用Webhook
   * @returns Promise<boolean> - 返回 true 表示提交成功，false 表示提交失败
   */
  handleSubmit: (
    onSubmit: (
      data: SubscribeRelationCreate | SubscribeRelationUpdate,
    ) => Promise<boolean>,
    onCancel: () => void,
    webhookHeaders: WebhookHeader[],
    enableWebhook: boolean,
  ) => Promise<boolean>;
}
