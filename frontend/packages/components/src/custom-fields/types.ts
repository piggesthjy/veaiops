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

// Custom Fields 组件类型定义
import type { ModernTableColumnProps } from '../shared/types';

export interface CustomFieldsProps<T = any> {
  /** 禁止选择的字段 */
  disabledFields: Map<string, string | undefined>;
  /** 基础的列 */
  columns: ModernTableColumnProps<T>[];
  /** 当前值 */
  value: string[] | undefined;
  /** 初始值 */
  initialFields?: string[];
  /** 确认回调 */
  confirm: (value: string[]) => void;
  /** 按钮文本 */
  buttonText?: string;
  /** 抽屉标题 */
  drawerTitle?: string;
}

export interface CheckBoxDrawerProps<T = any> {
  /** 禁止选择的字段 */
  disabledFields: Map<string, string | undefined>;
  /** 基础的列 */
  columns: ModernTableColumnProps<T>[];
  /** 显/隐 */
  visible: boolean;
  /** 关闭 */
  close: () => void;
  /** 确认 */
  confirm: (value: string[]) => void;
  /** 当前值 */
  value: string[] | undefined;
  /** 初始值 */
  initialValue?: string[];
  /** 标题 */
  title: string;
}
