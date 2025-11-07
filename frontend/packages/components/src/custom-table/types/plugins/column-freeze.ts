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
 * 列冻结插件类型定义
 * 基于 Arco Table sticky 能力和 EPS 平台冻结功能
 */
import type { ReactNode } from 'react';
import type { PluginPriorityEnum } from '../core/enums';

/**
 * 冻结位置
 */
export type FreezePosition = 'left' | 'right';

/**
 * 冻结列配置
 */
export interface FreezeColumnConfig {
  /** 列的 dataIndex */
  dataIndex: string;
  /** 冻结位置 */
  position: FreezePosition;
  /** 冻结优先级，数字越小越靠边 */
  priority?: number;
}

/**
 * 冻结样式配置
 */
export interface FreezeStyleConfig {
  /** 冻结列的背景色 */
  backgroundColor?: string;
  /** 冻结列的阴影 */
  boxShadow?: string;
  /** 冻结列的 z-index */
  zIndex?: number;
  /** 自定义冻结样式类名 */
  freezeClassName?: string;
}

/**
 * 列冻结配置
 */
export interface ColumnFreezeConfig {
  /** 是否启用插件 */
  enabled?: boolean;
  /** 插件优先级 */
  priority?: PluginPriorityEnum;
  /** 默认冻结的列 */
  defaultFrozenColumns?: FreezeColumnConfig[];
  /** 是否允许用户动态冻结 */
  allowUserFreeze?: boolean;
  /** 冻结样式配置 */
  styleConfig?: FreezeStyleConfig;
  /** 最大冻结列数 */
  maxFrozenColumns?: {
    left?: number;
    right?: number;
  };
  /** 冻结变化回调 */
  onFreezeChange?: (frozenColumns: FreezeColumnConfig[]) => void;
  /** 自定义冻结操作渲染 */
  renderFreezeAction?: (
    column: Record<string, unknown>,
    isFrozen: boolean,
  ) => ReactNode;
}

/**
 * 插件状态
 */
export interface ColumnFreezeState {
  /** 左侧冻结的列 */
  leftFrozenColumns: FreezeColumnConfig[];
  /** 右侧冻结的列 */
  rightFrozenColumns: FreezeColumnConfig[];
  /** 所有冻结的列 */
  allFrozenColumns: FreezeColumnConfig[];
  /** 冻结列的偏移量 */
  frozenOffsets: {
    left: Record<string, number>;
    right: Record<string, number>;
  };
}
