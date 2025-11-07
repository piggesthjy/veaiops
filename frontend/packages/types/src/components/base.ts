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

import type { ReactNode } from 'react';

/**
 * 组件基础类型定义
 * @description 提供组件库的基础通用类型

 *
 */

// ===== 基础类型定义 =====

/** 通用选项类型，支持扩展数据 */
export type Option<T = Record<string, any>> = {
  /** 显示标签，支持 React 节点 */
  label: ReactNode;
  /** 选项值 */
  value: string | number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 扩展数据 */
  extra?: T;
};

/** 事件处理器类型 */
export type EventHandler = (...args: unknown[]) => void;

/** 表单实例类型 - 兼容 Arco Design 的 FormInstance */
export interface FormInstance {
  setFieldsValue: (values: Record<string, unknown>) => void;
  getFieldsValue: () => Record<string, unknown>;
  resetFields: () => void;
  validateFields?: () => Promise<Record<string, unknown>>;
  // 添加 Arco Design FormInstance 的其他方法
  [key: string]: unknown;
}

/** 全局配置类型 */
export interface GlobalConfig {
  filterStyle?: {
    isWithBackgroundAndBorder?: boolean;
    style?: React.CSSProperties;
  };
  commonClassName?: string;
  [key: string]: unknown;
}
