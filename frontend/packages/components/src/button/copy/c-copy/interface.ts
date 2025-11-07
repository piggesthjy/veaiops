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

import type { PopoverProps } from '@arco-design/web-react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

// 复制的 copy-to-clipboard 的定义，它自身没有做导出
interface CopyOptions {
  debug?: boolean;
  message?: string;
  format?: string; // MIME type
  onCopy?: (clipboardData: Record<string, unknown>) => void;
}

/**
 * @title CCopyProps
 */
export interface CCopyProps {
  /** 子元素 */
  children?: ReactNode;
  /** 被复制的文案内容 */
  text?: string;
  /** 复制完成的回调 */
  onCopy?: (text: string, result: boolean) => void;
  /** 自定义复制触发Icon，会默认带上统一 c-m-icon 样式 */
  triggerIcon?: ReactElement;
  /** 自定义复制触发元素 */
  triggerEle?: ReactNode;
  /**
   * @zh 触发节点(默认是IconCopy)的可见性
   * @default default
   */
  showCopy?: 'default' | 'hover';
  /**
   * @zh 复制成功后的提示内容
   * @default 复制成功
   */
  successMessage?: ReactNode;
  /**
   * @zh 复制失败后的提示内容
   * @default 复制失败
   */
  failMessage?: ReactNode;
  /** 复制按钮 hover 时的提示内容 */
  tooltip?: ReactNode;
  /** 复制按钮禁用 */
  disabled?: boolean;
  /** 透传给 arco popover 组件的 props */
  arcoPopoverProps?: PopoverProps;
  /** 透传给 copy-to-clipboard 的 options */
  options?: CopyOptions;
  /** 透传给组件根节点的内联样式 */
  style?: CSSProperties;
  /** 挂到组件根节点的样式名 */
  className?: string | string[];
}

/**
 * @title CCopyHooksProps
 */
export interface CCopyHooksProps
  extends Omit<
    CCopyProps,
    'text' | 'triggerIcon' | 'triggerEle' | 'triggerVisible'
  > {
  /** 被复制的文案内容 */
  text: string;
}
