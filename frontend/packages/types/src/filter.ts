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
 * Filter 相关类型定义
 * 用于统一所有筛选器配置场景
 */

import type { ModuleType } from './module';
import type { FilterValue } from './query';

/**
 * Filter 查询状态
 */
export interface FilterQuery {
  /** 智能体类型 */
  agentType?: string | string[];
  /** 事件级别 */
  eventLevel?: string | string[];
  /** 其他动态字段 */
  [key: string]: FilterValue;
}

/**
 * Filter 处理器属性
 */
export interface FilterHandlerProps {
  /** 模块类型 */
  moduleType?: ModuleType;
  /** 是否显示模块类型列 */
  showModuleTypeColumn?: boolean;
  /** 其他动态属性 */
  [key: string]: unknown;
}

/**
 * 处理单个字段变更的参数
 */
export interface HandleChangeSingleParams {
  key: string;
  value?: FilterValue;
}

/**
 * 处理对象批量更新的参数
 */
export interface HandleChangeObjectParams {
  updates: Record<string, FilterValue>;
}

/**
 * Filter 配置函数参数
 */
export interface FilterConfigParams {
  /** 当前查询状态 */
  query: FilterQuery;
  /** 处理查询变更 */
  handleChange: (
    params: HandleChangeSingleParams | HandleChangeObjectParams,
  ) => void;
  /** 额外的处理器属性 */
  handleFiltersProps?: FilterHandlerProps;
}
