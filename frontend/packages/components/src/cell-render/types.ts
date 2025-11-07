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
 * CellRender 组件类型定义
 * @description 单元格渲染组件的类型定义

 *
 */

import type { CSSProperties, ReactNode } from 'react';

/**
 * 基础单元格渲染属性接口
 * @description 定义基础单元格渲染组件的属性
 */
export interface BaseCellRenderProps {
  /** 单元格内容 */
  children?: ReactNode;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 是否可点击 */
  clickable?: boolean;
  /** 点击回调 */
  onClick?: () => void;
}

/**
 * 省略号单元格渲染属性接口
 * @description 定义省略号单元格渲染组件的属性
 */
export interface EllipsisProps extends BaseCellRenderProps {
  /** 显示文本 */
  text: string;
  /** 最大长度 */
  maxLength?: number;
  /** 省略符号 */
  ellipsis?: string;
  /** 是否显示tooltip */
  showTooltip?: boolean;
  /** tooltip内容 */
  tooltipContent?: string;
}

/**
 * 员工单元格渲染属性接口
 * @description 定义员工单元格渲染组件的属性
 */
export interface EmployeeProps extends BaseCellRenderProps {
  /** 员工ID */
  employeeId: string;
  /** 员工姓名 */
  name?: string;
  /** 员工头像 */
  avatar?: string;
  /** 员工部门 */
  department?: string;
  /** 是否显示部门 */
  showDepartment?: boolean;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 头像大小 */
  avatarSize?: 'small' | 'medium' | 'large';
}

/**
 * 信息代码单元格渲染属性接口
 * @description 定义信息代码单元格渲染组件的属性
 */
export interface InfoWithCodeProps extends BaseCellRenderProps {
  /** 信息标题 */
  title: string;
  /** 信息代码 */
  code?: string;
  /** 信息描述 */
  description?: string;
  /** 是否显示代码 */
  showCode?: boolean;
  /** 代码样式 */
  codeStyle?: CSSProperties;
  /** 标题样式 */
  titleStyle?: CSSProperties;
  /** 描述样式 */
  descriptionStyle?: CSSProperties;
}

/**
 * 时间戳单元格渲染属性接口
 * @description 定义时间戳单元格渲染组件的属性
 */
export interface StampTimeProps extends BaseCellRenderProps {
  /** 时间值 */
  time: string | number | Date;
  /** 时间格式 */
  format?: string;
  /** 是否显示相对时间 */
  showRelative?: boolean;
  /** 相对时间阈值（毫秒） */
  relativeThreshold?: number;
  /** 时区 */
  timezone?: string;
  /** 是否显示时区 */
  showTimezone?: boolean;
}
