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

type WithOptionalRowSpan<T> = T & {
  rowSpan?: number;
};

type RowSpanRecordType<T = Record<string, any>> = WithOptionalRowSpan<T>;

interface RowSpanCellProps<T extends RowSpanRecordType> {
  record: T; // 包含rowSpan配置的记录对象
  children: ReactNode; // 自定义渲染组件
}

/**
 * RowSpan 函数返回的类型
 * 用于表格列的 render 函数中
 */
export type RowSpanReturnType = {
  children: ReactNode;
  props: {
    rowSpan: any;
  };
};

/**
 * 用于根据记录配置处理rowSpan逻辑的组件。
 * @param record - 包含rowSpan配置的记录对象。
 * @param renderComponent - 用于单元格的自定义渲染组件。
 * @returns 包含单元格内容和属性的对象。
 */
const RowSpanCellRender = <T extends RowSpanRecordType>({
  record,
  children,
}: RowSpanCellProps<T>): RowSpanReturnType => ({
  children,
  props: {
    rowSpan: record?.rowSpan,
  },
});

export { RowSpanCellRender };
