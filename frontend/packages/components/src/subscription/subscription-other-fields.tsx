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

import { DatePicker, Form } from '@arco-design/web-react';
import type React from 'react';
import { Select } from '../form-control';

const { RangePicker } = DatePicker;

/**
 * 订阅关系表单 - 其他字段组件属性
 */
export interface SubscriptionOtherFieldsProps {
  /** 事件级别选项 */
  eventLevelOptions: Array<{ label: string; value: string }>;

  /** 是否显示策略更新提示 */
  showStrategyTooltip?: boolean;

  /** 隐藏策略更新提示的回调 */
  hideStrategyTooltip?: () => void;

  /** 事件级别是否必填 */
  eventLevelRequired?: boolean;

  /** 事件级别 placeholder */
  eventLevelPlaceholder?: string;

  /** 消息卡片通知策略是否必填 */
  informStrategyRequired?: boolean;

  /** 消息卡片通知策略 placeholder */
  informStrategyPlaceholder?: string;

  /** 策略更新提示组件（可选，用于显示更新提示） */
  UpdateTooltipComponent?: React.ComponentType<{
    show?: boolean;
    message?: string;
    onHide?: () => void;
    children: React.ReactNode;
  }>;

  /** API 客户端实例（用于获取通知策略） */
  apiClient?: {
    informStrategy?: {
      getApisV1ManagerEventCenterInformStrategy?: (params: {
        skip?: number;
        limit?: number;
      }) => Promise<unknown>;
    };
  };
}

/**
 * 订阅关系表单 - 其他字段组件
 *
 * @description 用于订阅关系表单的通用字段组件，包含：
 * - 事件级别选择
 * - 配置生效时间范围
 * - 消息卡片通知策略选择
 *
 * @example
 * ```tsx
 * <SubscriptionOtherFields
 *   eventLevelOptions={eventLevelOptions}
 *   eventLevelRequired={true}
 *   informStrategyRequired={true}
 *   showStrategyTooltip={showTooltip}
 *   hideStrategyTooltip={hideTooltip}
 *   UpdateTooltipComponent={UpdateTooltip}
 *   apiClient={apiClient}
 * />
 * ```
 */
export const SubscriptionOtherFields: React.FC<
  SubscriptionOtherFieldsProps
> = ({
  eventLevelOptions,
  showStrategyTooltip = false,
  hideStrategyTooltip,
  eventLevelRequired = true,
  eventLevelPlaceholder = '请选择事件级别',
  informStrategyRequired = true,
  informStrategyPlaceholder = '请选择消息卡片通知策略',
  UpdateTooltipComponent,
  apiClient,
}) => {
  // 构建事件级别的 rules
  const eventLevelRules = eventLevelRequired
    ? [{ required: true, message: '请选择事件级别' }]
    : undefined;

  // 构建消息卡片通知策略的 rules
  const informStrategyRules = informStrategyRequired
    ? [{ required: true, message: '请选择消息卡片通知策略' }]
    : undefined;

  // 消息卡片通知策略选择器
  const strategySelector = (
    <Select.Block
      isControl
      required={informStrategyRequired}
      formItemProps={{
        label: '消息卡片通知策略',
        field: 'inform_strategy_ids',
        rules: informStrategyRules,
      }}
      controlProps={{
        mode: 'multiple',
        placeholder: informStrategyPlaceholder,
        ...(apiClient?.informStrategy && {
          dataSource: {
            serviceInstance: apiClient.informStrategy,
            api: 'getApisV1ManagerEventCenterInformStrategy',
            payload: {},
            responseEntityKey: 'data',
            optionCfg: {
              labelKey: 'name',
              valueKey: 'id',
            },
          },
        }),
      }}
    />
  );

  return (
    <>
      <Select.Block
        isControl
        required={eventLevelRequired}
        formItemProps={{
          label: '事件级别',
          field: 'event_level',
          rules: eventLevelRules,
        }}
        controlProps={{
          mode: 'multiple',
          placeholder: eventLevelPlaceholder,
          allowClear: !eventLevelRequired,
          options: eventLevelOptions,
        }}
      />

      <Form.Item
        label="配置生效时间"
        field="timeRange"
        rules={[{ required: true, message: '请选择生效时间范围' }]}
      >
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          placeholder={['开始时间', '结束时间']}
          className="w-full"
        />
      </Form.Item>

      {UpdateTooltipComponent ? (
        <UpdateTooltipComponent
          show={showStrategyTooltip}
          message="策略数据已更新"
          onHide={hideStrategyTooltip}
        >
          {strategySelector}
        </UpdateTooltipComponent>
      ) : (
        strategySelector
      )}
    </>
  );
};
