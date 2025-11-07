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
 * 引导提示组件类型定义
 */

export interface GuideTipOptions {
  /** 提示内容 */
  content: string;
  /** 目标元素选择器 */
  selector: string;
  /** 提示位置 */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 自定义样式 */
  customStyle?: Partial<CSSStyleDeclaration>;
  /** 按钮文本 */
  buttonText?: string;
  /** 是否自动关闭 */
  autoClose?: boolean;
  /** 自动关闭延迟时间（毫秒） */
  autoCloseDelay?: number;
  /** 是否点击外部区域关闭 */
  closeOnOutsideClick?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
}

export interface Position {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface Size {
  width: number;
  height: number;
}
