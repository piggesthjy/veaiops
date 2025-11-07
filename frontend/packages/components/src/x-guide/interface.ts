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

import type { TooltipProps } from '@arco-design/web-react';
import type React from 'react';
import type { StepNumber } from './constant/lang';

export type SinglePlacement = 'top' | 'bottom' | 'left' | 'right';

export type Placement =
  | 'top'
  | 'left'
  | 'bottom'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left-top'
  | 'left-bottom'
  | 'right-top'
  | 'right-bottom';

export type SelectorType = string | Element | (() => Element);

export type ContentType = string | React.ReactNode | (() => React.ReactNode);

export interface ITargetPos {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * @title IStep
 */
export interface IStep {
  /**
   * @zh 元素选择器，支持 querySelector 选择器
   */
  selector?: SelectorType;
  /**
   * @zh 相对于的目标位置，优先级低于selector
   */
  targetPos?: ITargetPos;
  /**
   * @zh 展示标题
   */
  title?: string;
  /**
   * @zh 展示图片
   */
  imageTitle?: any;
  /**
   * @zh 展示描述
   */
  content?: ContentType;
  /**
   * @zh 引导 的位置，如 bottom-left、left-bottom、bottom 等
   */
  placement?: Placement;
  /**
   * @zh modal 偏移量，可改变 modal 的位置，如 { x: 20, y: 10 }
   */
  offset?: Record<'x' | 'y', number>;
  /**
   * @zh 用于控制焦点箭头 和 提示框边缘的距离
   * @defaultValue 24
   */
  marginNumber?: number;
  /**
   * @zh 父元素节点，元素可被新增到 body，如果 parent 为 null，则会默认被新增到选择器 offsetParent
   */
  parent?: 'body' | null;
  /**
   * @zh 控制 guide 每个步骤显示隐藏，用于异步渲染
   */
  visible?: boolean;
  /**
   * @zh 是否跳过该步骤
   */
  skip?: boolean;
  /**
   * @zh 是否关闭按钮的tooltip
   * @defaultValue false
   */
  closeTooltip?: boolean;
  /**
   * @zh 关闭按钮的tooltipProps，可以在此属性中更改文字
   */
  closeTooltipProps?: TooltipProps;
  /**
   * @zh 是否禁用自动滚动，禁用后，引导弹框的位置完全取决于元素的位置，可能会存在引导弹框显示不全的问题，推荐在非步骤弹框中使用
   * @defaultValue false
   */
  disableScroll?: boolean;
  /**
   * @zh 点击下一步之前触发的回调
   */
  beforeStepChange?: (
    curStep: IStep,
    curStepIndex: number,
    steps: IStep[],
  ) => void;
}

/**
 * @title IGuide
 */
export interface IGuide {
  /**
   * @zh 引导步骤，详细配置见IStep
   */
  steps: IStep[];
  /**
   * @zh 引导的类型，分为卡片引导和气泡提示引导
   * @defaultValue 'card'
   */
  type?: 'tip' | 'card' | 'richCard';
  /**
   * @zh 用于不同的主题色的定制，仅在 type = tip 时生效，默认蓝色，bits-light 时展示为白底导航
   * @defaultValue null
   */
  theme?: 'bits-light' | null;
  /**
   * @zh 用于控制是否展示步骤条
   * @defaultValue null
   */
  showStepInfo?: boolean;
  /**
   * @zh 用于展示用户按钮
   * @defaultValue null
   */
  showAction?: boolean;
  /**
   * @zh 用于控制焦点和弹窗之间的间隔
   * @defaultValue null
   */
  hotspotDistance?: number;
  /**
   * @zh 本地缓存 key，缓存是否展示过该引导页，需确保系统内 localKey 唯一性
   */
  localKey?: string;
  /**
   * @zh 是否展示蒙层, 可选择透明蒙层
   */
  mask?: boolean | 'transparent';
  /**
   * @zh 弹窗是否展示箭头
   */
  arrow?: boolean;
  /**
   * @zh 弹窗是否展示热点
   */
  hotspot?: boolean;
  /**
   * @zh 是否可以跳过引导
   */
  closable?: boolean;
  /**
   * @zh 初始步骤，步骤可受控，为-1 则不展示组件
   */
  step?: number;
  /**
   * @zh 弹窗类名
   */
  modalClassName?: string;
  /**
   * @zh 蒙层类名
   */
  maskClassName?: string;
  /**
   * @zh 过期时间，大于等于该时间都不展示引导页
   */
  expireDate?: string;
  /**
   * @zh 控制 guide 显示隐藏，用于异步渲染
   */
  visible?: boolean;
  /**
   * @zh 多语言
   * @defaultValue 'zh'
   */
  lang?: 'zh' | 'en' | 'ja';
  /**
   * @zh modal 的步骤信息文案
   */
  stepText?: (stepIndex: number, stepCount: number) => string;
  /**
   * @zh '上一步'按钮文案
   */
  prevText?: string;
  /**
   * @zh 下一步'按钮文案
   */
  nextText?: string;
  /**
   * @zh 确认按钮文案
   */
  okText?: string;
  /**
   * @zh 点击下一步之前的回调
   */
  beforeStepChange?: (stepIndex: number, step: IStep) => void;
  /**
   * @zh 点击下一步的回调
   */
  afterStepChange?: (stepIndex: number, step: IStep) => void;
  /**
   * @zh 引导结束的回调
   */
  onClose?: () => void;
  /**
   * @zh 用户按钮行为
   */
  onActionChange?: (action: string) => void;
  /**
   * @zh 是否显示'上一步'按钮
   */
  showPreviousBtn?: boolean;
  /**
   * @zh 自定义跳过引导的元素
   */
  closeEle?: React.ReactNode;
  /**
   * @zh 点击蒙层是否可以关闭
   * @defaultValue false
   */
  maskClosable?: boolean;
  /**
   * @zh 自定义蒙层挂载位置
   */
  getMaskContainer?: () => Element;
}

export interface IModal {
  type: string;
  theme?: 'bits-light' | null;
  showStepInfo?: boolean;
  showAction?: boolean;
  anchorEl: HTMLElement;
  parentEl: HTMLElement;
  realWindow: Window;
  steps: IStep[];
  stepIndex: number;
  mask: boolean | string;
  arrow: boolean;
  hotspot: boolean | string;
  closable: boolean;
  /* close element */
  closeEle?: React.ReactNode;
  onClose: () => void;
  onChange: (direction: number) => void;
  onActionChange: (action: string) => void;
  stepText?: (stepIndex: number, stepCount: number) => string;
  showPreviousBtn: boolean;
  nextText?: string;
  prevText?: string;
  okText?: string;
  className?: string;
  TEXT: (
    key: 'NEXT_STEP' | 'I_KNOW' | 'STEP_NUMBER' | 'PREV_STEP' | 'CLOSE',
  ) => string | StepNumber;
}
