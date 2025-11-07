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
 * Title Search 组件类型定义
 * 从 components/title-search/typing.d.ts 迁移而来
 */

import type { SelectProps } from '@arco-design/web-react';

/**
 * 简单选项类型
 */
export type SimpleOptions = string[] | number[];

/**
 * 带底部操作的选择器属性
 */
export interface SelectCustomWithFooterProps
  extends Omit<SelectProps, 'options' | 'onChange' | 'value'> {
  options?: SimpleOptions;
  onChange: (value: unknown) => void;
  value?: string[] | number[];
}
