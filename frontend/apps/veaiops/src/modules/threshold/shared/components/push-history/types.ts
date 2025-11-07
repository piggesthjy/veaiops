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

import type { ModuleType } from '@veaiops/types';
import type { Event } from 'api-generate';
import type React from 'react';

/**
 * 历史事件记录类型
 * @description 直接使用 api-generate 中的 Event 类型，避免重复定义
 */
export type PushHistoryRecord = Event;

/**
 * 历史事件管理组件属性
 */
export interface PushHistoryManagerProps {
  /** 模块类型，用于过滤历史事件 */
  moduleType?: ModuleType;
  /** 是否显示模块类型列 */
  showModuleTypeColumn?: boolean;
  /** 自定义操作按钮 */
  customActions?: (record: PushHistoryRecord) => React.ReactNode;
  /** 查看详情回调 */
  onViewDetail?: (record: PushHistoryRecord) => void;
  /** 重试回调 */
  onRetry?: (recordId: string) => void;
}

/**
 * 表格列配置属性
 */
export interface TableColumnsProps {
  /** 自定义操作按钮 */
  customActions?: (record: PushHistoryRecord) => React.ReactNode;
  /** 重试回调 */
  onRetry?: (recordId: string) => void;
  /** 查看详情回调 */
  onViewDetail?: (record: PushHistoryRecord) => void;
  /** 是否显示模块类型列 */
  showModuleTypeColumn?: boolean;
}
