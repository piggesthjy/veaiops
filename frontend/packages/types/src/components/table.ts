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

// 由于 types 包不直接依赖 arco-design，我们使用类型兼容的方式
type SorterResult = any;

/**
 * 表格组件类型定义
 * @description 提供表格相关的类型定义

 *
 */

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
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示提示 */
  showTip?: boolean;
  /** 前端枚举配置 */
  frontEnum?: unknown;
}
