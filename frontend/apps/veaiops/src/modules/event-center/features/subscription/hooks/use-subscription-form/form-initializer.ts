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

import { ModuleType } from '@/types/module';
import type { FormInstance } from '@arco-design/web-react';
import { AgentType, type SubscribeRelationWithAttributes } from 'api-generate';
import { normalizeStrategyIds } from './strategy-id-normalizer';
import { createDefaultTimeRange, parseTimeRange } from './time-range-utils';

/**
 * 关注属性字段列表
 */
const INTEREST_FIELDS = [
  'interest_products',
  'interest_projects',
  'interest_customers',
  'webhook_endpoint',
] as const;

/**
 * 设置表单的关注属性字段
 *
 * 遍历所有关注属性字段，如果初始数据中存在值则设置到表单中
 * 这样处理的好处是避免不必要的字段覆盖
 *
 * @param form - 表单实例
 * @param initialData - 初始数据
 *
 * @example
 * ```ts
 * setInterestFields(form, {
 *   interest_products: ['product1', 'product2'],
 *   interest_projects: null, // 不会被设置
 *   webhook_endpoint: 'https://example.com'
 * });
 * ```
 */
export const setInterestFields = (
  form: FormInstance,
  initialData: SubscribeRelationWithAttributes,
): void => {
  INTEREST_FIELDS.forEach((field) => {
    const value = initialData[field];
    // 只设置非空值
    if (value != null) {
      form.setFieldValue(field, value);
    }
  });
};

/**
 * 创建编辑模式的表单初始值
 *
 * 处理编辑模式下的数据转换：
 * 1. 规范化策略ID（处理对象数组）
 * 2. 解析时间范围（ISO字符串转Date）
 * 3. 转换事件级别字段名（event_level -> event_levels）
 * 4. 保留其他字段原值
 *
 * @param initialData - 初始数据
 * @returns 表单初始值对象
 *
 * @example
 * ```ts
 * const formValues = createEditFormValues({
 *   name: '测试订阅',
 *   inform_strategy_ids: [{ id: '123' }, { id: '456' }],
 *   start_time: '2025-01-01T00:00:00.000Z',
 *   end_time: '2025-12-31T23:59:59.999Z',
 *   event_level: ['P0', 'P1'],
 *   // ... 其他字段
 * });
 * // 结果：
 * // {
 * //   name: '测试订阅',
 * //   inform_strategy_ids: ['123', '456'],
 * //   effective_time_range: [Date(2025-01-01), Date(2025-12-31)],
 * //   event_levels: ['P0', 'P1'],
 * //   // ... 其他字段
 * // }
 * ```
 */
export const createEditFormValues = (
  initialData: SubscribeRelationWithAttributes,
): Record<string, unknown> => {
  // 展开初始数据，但排除 event_level 字段以避免冲突
  const { event_level, ...restData } = initialData;

  return {
    ...restData,
    // 规范化策略ID数组
    inform_strategy_ids: normalizeStrategyIds(initialData.inform_strategy_ids),
    // 解析时间范围
    effective_time_range: parseTimeRange(
      initialData.start_time,
      initialData.end_time,
    ),
    // 转换事件级别字段名：event_level（后端）-> event_levels（前端表单）
    // 确保即使是空数组也能正确显示
    event_levels: Array.isArray(event_level) ? event_level : [],
  };
};

/**
 * 创建新建模式的表单初始值
 *
 * 设置新建订阅时的默认值：
 * 1. 默认时间范围：当前时间到100年后
 * 2. 默认事件级别：空数组（表示全选）
 * 3. 特定模块的默认智能体：
 *    - Oncall模块：默认选择内容识别Agent
 *    - 智能阈值模块：默认选择智能阈值Agent
 *    - 事件中心模块：默认选择内容识别Agent
 *
 * @param moduleType - 模块类型
 * @returns 表单初始值对象
 *
 * @example
 * ```ts
 * // 普通模式
 * createNewFormValues()
 * // { effective_time_range: [now, now+100years], event_levels: [] }
 *
 * // Oncall模块
 * createNewFormValues(ModuleType.ONCALL)
 * // {
 * //   effective_time_range: [now, now+100years],
 * //   event_levels: [],
 * //   agent_type: 'chatops_interest_agent'
 * // }
 *
 * // 智能阈值模块
 * createNewFormValues(ModuleType.INTELLIGENT_THRESHOLD)
 * // {
 * //   effective_time_range: [now, now+100years],
 * //   event_levels: [],
 * //   agent_type: 'intelligent_threshold_agent'
 * // }
 *
 * // 事件中心模块
 * createNewFormValues(ModuleType.EVENT_CENTER)
 * // {
 * //   effective_time_range: [now, now+100years],
 * //   event_levels: [],
 * //   agent_type: 'chatops_interest_agent'
 * // }
 * ```
 */
export const createNewFormValues = (
  moduleType?: ModuleType,
): Record<string, unknown> => {
  const defaultValues: Record<string, unknown> = {
    effective_time_range: createDefaultTimeRange(),
    // ⚠️ 注意：虽然后端支持空数组表示"全部级别"，但前端设置了必填验证
    // 为了更好的用户体验，不设置默认值，让用户主动选择
    // event_levels: [], // 不设置默认值，让用户主动选择
  };

  // 根据模块类型设置默认智能体
  if (moduleType === ModuleType.ONCALL) {
    // Oncall模块默认选择内容识别Agent
    defaultValues.agent_type = AgentType.CHATOPS_INTEREST_AGENT;
  } else if (moduleType === ModuleType.INTELLIGENT_THRESHOLD) {
    // 智能阈值模块默认选择智能阈值Agent
    defaultValues.agent_type = AgentType.INTELLIGENT_THRESHOLD_AGENT;
  }
  // 事件中心模块：不设置默认值，因为有两个选项，让用户自己选择

  return defaultValues;
};

/**
 * 初始化表单数据
 *
 * 根据是否有初始数据来决定初始化策略：
 * - 有初始数据：编辑模式，使用 createEditFormValues
 * - 无初始数据：新建模式，使用 createNewFormValues
 *
 * @param form - 表单实例
 * @param initialData - 初始数据（可选）
 * @param moduleType - 模块类型（可选）
 */
export const initializeForm = (
  form: FormInstance,
  initialData?: SubscribeRelationWithAttributes | null,
  moduleType?: ModuleType,
): void => {
  // 重置表单
  form.resetFields();

  if (initialData) {
    // 编辑模式：设置初始值
    const editValues = createEditFormValues(initialData);
    form.setFieldsValue(editValues);

    // 单独设置关注属性字段（避免覆盖）
    setInterestFields(form, initialData);
  } else {
    // 新建模式：设置默认值
    const newValues = createNewFormValues(moduleType);
    form.setFieldsValue(newValues);
  }
};
