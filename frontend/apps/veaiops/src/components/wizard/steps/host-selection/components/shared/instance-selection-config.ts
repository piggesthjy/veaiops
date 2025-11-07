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

import type React from 'react';
import type { InstanceData } from './instance-list-item';

/**
 * 数据转换函数类型
 */
export type DataTransformer<T> = (item: T) => InstanceData;

/**
 * 选择动作函数类型
 */
export type SelectionAction<T> = (items: T[]) => void;

/**
 * 搜索过滤函数类型
 */
export type SearchFilter<T> = (item: T, searchValue: string) => boolean;

/**
 * 实例选择组件配置接口
 */
export interface InstanceSelectionConfig<T> {
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 空状态描述 */
  emptyDescription: string;
  /** 搜索框占位符 */
  searchPlaceholder: string;
  /** 选择提示的物品类型 */
  itemType: string;
  /** 图标 */
  icon: React.ReactNode;
  /** 数据转换函数 */
  dataTransformer: DataTransformer<T>;
  /** 选择动作函数 */
  selectionAction: SelectionAction<T>;
  /** 搜索过滤函数 */
  searchFilter: SearchFilter<T>;
  /** 获取项目ID的函数 */
  getId: (item: T) => string;
  /** 是否使用特殊的主机列表（Zabbix专用） */
  useHostList?: boolean;
}
