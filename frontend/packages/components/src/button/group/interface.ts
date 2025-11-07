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

import type {
  PopconfirmProps,
  PopoverProps,
  TooltipProps,
} from '@arco-design/web-react';
import type { BaseButtonProps } from '@arco-design/web-react/es/Button/interface';
import type React from 'react';
import type { ReactNode } from 'react';

/**
 * 基础按钮属性接口
 */
export interface ButtonProps {
  text?: string; // 按钮文本
  visible?: boolean; // 按钮是否可见
  disabled?: boolean; // 按钮是否禁用
  tooltip?: string | ReactNode; // 按钮提示文本（支持字符串或 ReactNode）
  tooltipProps?: TooltipProps; // Tooltip 自定义属性（支持自定义 zIndex 等）
  onClick?: () => void; // 按钮点击事件处理函数
  enablePopoverWrapper?: boolean; // 是否启用 PopoverWrapper 组件
  popoverProps?: PopoverProps; // 弹出框属性
  buttonProps?: BaseButtonProps;
  buttonGroupProps?: ButtonGroupConfiguration;
  dataTestId?: string; // 按钮的测试ID，用于自动化测试
}

/**
 * 带有 Popconfirm 功能的按钮属性接口
 */
export interface PopconfirmButtonProps {
  supportPopConfirm?: boolean; // 是否支持 Popconfirm
  popConfirmTitle?: string | ReactNode; // Popconfirm 的标题（支持字符串或 ReactNode）
  popConfirmContent?: string | ReactNode; // Popconfirm 的内容（支持字符串或 ReactNode）
  popconfirmProps?: PopconfirmProps;
}

/**
 * DropDown 属性接口
 */
export interface DropDownProps {
  dropdownProps?: {
    on?: boolean;
    screen?: {
      min?: number;
      max?: number;
    };
  };
}

/**
 * 按钮配置接口，继承了 ButtonProps 和 PopconfirmButtonProps、DropDownProps
 */
export interface ButtonConfiguration
  extends ButtonProps,
    PopconfirmButtonProps,
    DropDownProps {}

/**
 * 按钮组配置接口
 */
interface ButtonGroupConfiguration {
  icon: ReactNode; // 按钮组图标
  children: ReactNode; // 按钮组子元素
}

export interface ButtonConfigurationWithDropdown {
  isInDropdown: boolean;
  configs: ButtonConfiguration[];
  dropDownButtonProps?: BaseButtonProps;
  dropdownId?: string;
  dropdownClassName?: string;
}
/**
 * 最终的按钮配置接口，可以是按钮配置数组或包含按钮配置数组的对象
 */
export type FinalButtonConfiguration =
  | ButtonConfiguration[]
  | ButtonConfigurationWithDropdown;

/**
 * Dropdown 菜单配置接口
 */
export interface DropdownMenuConfiguration {
  key: string | undefined;
  visible?: boolean;
  onClick: (() => void) | undefined;
  buttonProps: BaseButtonProps | undefined;
  supportPopConfirm?: boolean;
  tooltip?: string | ReactNode; // 支持字符串或 ReactNode，与 ButtonConfiguration 保持一致
  text?: string;
  disabled?: boolean;
  popConfirmTitle?: string | ReactNode; // Popconfirm 的标题（支持字符串或 ReactNode）
  popConfirmContent?: string | ReactNode; // Popconfirm 的内容（支持字符串或 ReactNode）
  popconfirmProps?: PopconfirmProps;
}
