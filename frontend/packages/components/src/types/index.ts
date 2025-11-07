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
 * VE-ARCH Components 类型导出
 * @description 提供组件库相关的类型定义

 *
 */

import type { SorterResult } from '@arco-design/web-react/es/Table/interface';
import type { ReactNode } from 'react';

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

// ===== 表格相关类型 =====

export type IQueryOptions<T = unknown> = (
  params?: Record<string, unknown>,
) => Promise<T[]> | T[];

/** 自定义表头filter的属性 */
export interface TableColumnTitleProps {
  /** 列标题 */
  title: string;
  /** 列在数据中对于的key */
  dataIndex: string;
  /** 筛选key */
  filterDataIndex?: string;
  /** 排序的值 */
  sorter?: SorterResult;
  /** 筛选的值 */
  filters: Record<string, string | number | string[] | number[]>;
  /** 排序或者筛选触发的值 */
  onChange: (
    type: string,
    value?: { [p: string]: (string | number)[] | string | number | null },
  ) => void;
  /** 查询 */
  queryOptions?: IQueryOptions;
  /** 表头是否有提示 */
  tip?: ReactNode;
  /**
   * 是否支持多选
   * @default true
   */
  multiple?: boolean;
}

// ===== 公共组件类型 =====

// 注意：Public 命名空间未使用，已移除
// /** Public 命名空间，用于兼容原有的导入方式 */
// export const Public = {
//   // 这里可以添加其他公共组件和工具
// } as const;

// 命名导出
