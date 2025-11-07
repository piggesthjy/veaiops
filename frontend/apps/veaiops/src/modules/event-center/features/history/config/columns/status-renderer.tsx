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

import { Badge } from '@arco-design/web-react';
import { EVENT_SHOW_STATUS_MAP, EVENT_STATUS_MAP } from '@ec/subscription';
import { EMPTY_CONTENT_TEXT } from '@veaiops/constants';
import type { EventShowStatus } from 'api-generate';
import { EventStatus } from 'api-generate';

/**
 * 状态显示映射配置 - 将EVENT_STATUS_MAP转换为Badge组件需要的格式
 */
const getStatusDisplayConfig = (statusCode: number) => {
  const statusOption = EVENT_STATUS_MAP[statusCode];
  if (!statusOption) {
    return { status: 'default' as const, text: `未知状态(${statusCode})` };
  }

  // 根据状态码确定Badge的status类型
  let badgeStatus: 'success' | 'error' | 'processing' | 'default';
  switch (statusCode) {
    case EventStatus.INITIAL: // 初始状态
      badgeStatus = 'default';
      break;
    case EventStatus.SUBSCRIBED: // 订阅匹配已完成，待构造通知卡片
    case EventStatus.CARD_BUILT: // 通知卡片已构造，待发送通知卡片
      badgeStatus = 'processing';
      break;
    case EventStatus.DISTRIBUTED: // 通知卡片已发送
      badgeStatus = 'success';
      break;
    case EventStatus.NO_DISTRIBUTION: // 无订阅匹配，不发送通知卡片
    case EventStatus.CHATOPS_NO_MATCH: // 未命中检测规则，不发送通知卡片
    case EventStatus.CHATOPS_RULE_FILTERED: // 命中过滤规则，不发送通知卡片
    case EventStatus.CHATOPS_RULE_LIMITED: // 告警被抑制，不发送通知卡片
      badgeStatus = 'error';
      break;
    default:
      badgeStatus = 'default';
  }

  return {
    status: badgeStatus,
    text: statusOption.label,
  };
};

/**
 * 渲染事件状态枚举值 - 使用Badge显示
 * 修复：使用统一的状态映射，与筛选器选项保持一致
 *
 * 边界case处理：
 * - null/undefined: 显示空内容
 * - 字符串: 转换为数字
 * - NaN: 显示未知状态
 * - 负数/小数: 取整后显示
 * - 未知枚举值: 显示"未知状态(值)"
 */
export const renderEventStatus = (value?: number | string | null) => {
  // 边界case 1: 处理 null/undefined
  if (value === undefined || value === null) {
    return EMPTY_CONTENT_TEXT;
  }

  // 边界case 2: 确保值是数字类型
  let statusCode: number;
  if (typeof value === 'string') {
    statusCode = parseInt(value, 10);
    // 边界case 3: 处理 NaN
    if (Number.isNaN(statusCode)) {
      return <Badge status="default" text={`无效状态(${value})`} />;
    }
  } else if (typeof value === 'number') {
    // 边界case 4: 处理小数，取整
    statusCode = Math.floor(value);
  } else {
    // 边界case 5: 处理其他类型
    return <Badge status="default" text={`无效状态(${String(value)})`} />;
  }

  // 使用统一的状态映射配置
  const config = getStatusDisplayConfig(statusCode);

  return <Badge status={config.status} text={config.text} />;
};

/**
 * 渲染事件状态 - 显示中文状态
 * 使用 show_status 字段（EventShowStatus 枚举）
 *
 * 边界case处理：
 * - null/undefined/空字符串: 显示空内容
 * - 未知枚举值: 显示原值（容错处理）
 * - 非字符串类型: 转换为字符串后处理
 */
export const renderEventShowStatus = (value?: EventShowStatus | null) => {
  // 边界case 1: 处理 null/undefined
  if (!value) {
    return EMPTY_CONTENT_TEXT;
  }

  // 边界case 2: 确保值是字符串类型并去除空格
  const statusValue = String(value).trim();
  if (!statusValue) {
    return EMPTY_CONTENT_TEXT;
  }

  // 从映射中获取配置
  const config = EVENT_SHOW_STATUS_MAP[statusValue as EventShowStatus];

  // 边界case 3: 处理未知的状态（后端新增但前端未同步）
  if (!config) {
    return <Badge status="default" text={statusValue} />;
  }

  // 根据状态确定 Badge 样式
  let badgeStatus: 'success' | 'error' | 'processing' | 'warning' | 'default';
  switch (statusValue as EventShowStatus) {
    case '等待发送':
      badgeStatus = 'processing';
      break;
    case '发送成功':
      badgeStatus = 'success';
      break;
    case '未订阅':
    case '未命中规则':
      badgeStatus = 'warning';
      break;
    case '命中过滤规则':
    case '告警抑制':
      badgeStatus = 'error';
      break;
    default:
      badgeStatus = 'default';
  }

  return <Badge status={badgeStatus} text={config.label} />;
};
