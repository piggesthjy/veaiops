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
import type { EventHandler, FormInstance, GlobalConfig } from './base';

/**
 * 过滤器插件类型定义
 * @description 提供过滤器插件相关的类型定义

 *
 */

// ===== 过滤器插件类型 =====

/** 插件配置类型 */
export type PluginConfig = Record<string, unknown>;

/** 字段项接口 */
export interface FieldItem {
  field?: string;
  label?: string;
  /** 组件类型 */
  type?: string;
  /** 子组件类型 */
  childrenType?: string;
  col?: number;
  /** 作用在Field上的属性 */
  fieldProps?: Record<string, unknown>;
  /** type对应的组件上的属性 */
  componentProps?: Record<string, unknown>;
  /** FormItem初始值 */
  initialValue?: unknown;
  /** 展示的值 */
  textInfo?: unknown;
  display?: unknown;
  format?: unknown;
  /** 是否可见 */
  visible?: boolean;
}

/** 插件上下文 */
export interface FilterPluginContext {
  /** 表单实例 */
  form?: FormInstance;
  /** 全局配置 */
  globalConfig?: GlobalConfig;
  /** 事件总线 */
  eventBus?: FilterEventBus;
}

/** 事件总线接口 */
export interface FilterEventBus {
  emit: (event: string, ...args: unknown[]) => void;
  on: (params: { event: string; handler: EventHandler }) => void;
  off: (params: { event: string; handler: EventHandler }) => void;
}

/** 插件渲染属性 */
export interface FilterPluginRenderProps {
  /** 字段配置 */
  field: FieldItem;
  /** 原始组件属性 */
  componentProps: Record<string, unknown>;
  /** 劫持后的组件属性 */
  hijackedProps: Record<string, unknown>;
  /** 插件上下文 */
  context?: FilterPluginContext;
}

/** 插件钩子 */
export interface FilterPluginHooks {
  /** 组件渲染前 */
  beforeRender?: (props: FilterPluginRenderProps) => FilterPluginRenderProps;
  /** 组件渲染后 */
  afterRender?: (
    element: ReactNode,
    props: FilterPluginRenderProps,
  ) => ReactNode;
  /** 配置验证 */
  validateConfig?: (config: PluginConfig) => boolean | string;
}

/** 插件注册选项 */
export interface PluginRegistryOptions {
  /** 是否覆盖已存在的插件 */
  override?: boolean;
  /** 插件优先级 */
  priority?: number;
}

/** 插件基础接口 */
export interface FilterPlugin {
  /** 插件唯一标识 */
  type: string;
  /** 插件名称 */
  name: string;
  /** 插件描述 */
  description?: string;
  /** 插件版本 */
  version?: string;
  /** 渲染组件 */
  render: (props: FilterPluginRenderProps) => ReactNode;
  /** 插件配置验证 */
  validateConfig?: (config: PluginConfig) => boolean;
  /** 插件默认配置 */
  defaultConfig?: PluginConfig;
  /** 依赖的其他插件 */
  dependencies?: string[];
}
