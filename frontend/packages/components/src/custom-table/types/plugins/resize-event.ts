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
 * 表格调整大小事件类型定义
 * 支持列宽调整和表格容器大小变化事件
 */

import type { BaseRecord } from '../core/common';

/**
 * 调整大小事件类型
 */
export type ResizeEventType = 'column' | 'container' | 'viewport';

/**
 * 列调整大小事件
 */
export interface ColumnResizeEvent {
  /** 事件类型 */
  type: 'column';
  /** 列标识 */
  dataIndex: string;
  /** 调整前宽度 */
  oldWidth: number;
  /** 调整后宽度 */
  newWidth: number;
  /** 宽度变化量 */
  deltaWidth: number;
  /** 触发时间戳 */
  timestamp: number;
  /** 是否由用户手动调整 */
  isManual: boolean;
  /** 调整原因 */
  reason?: 'user_drag' | 'auto_fit' | 'responsive' | 'programmatic';
}

/**
 * 容器调整大小事件
 */
export interface ContainerResizeEvent {
  /** 事件类型 */
  type: 'container';
  /** 调整前尺寸 */
  oldSize: {
    width: number;
    height: number;
  };
  /** 调整后尺寸 */
  newSize: {
    width: number;
    height: number;
  };
  /** 尺寸变化量 */
  deltaSize: {
    width: number;
    height: number;
  };
  /** 触发时间戳 */
  timestamp: number;
  /** 调整原因 */
  reason?: 'window_resize' | 'layout_change' | 'container_change';
}

/**
 * 视窗调整大小事件
 */
export interface ViewportResizeEvent {
  /** 事件类型 */
  type: 'viewport';
  /** 调整前视窗尺寸 */
  oldViewport: {
    width: number;
    height: number;
  };
  /** 调整后视窗尺寸 */
  newViewport: {
    width: number;
    height: number;
  };
  /** 视窗变化量 */
  deltaViewport: {
    width: number;
    height: number;
  };
  /** 触发时间戳 */
  timestamp: number;
  /** 屏幕方向 */
  orientation?: 'portrait' | 'landscape';
}

/**
 * 调整大小事件联合类型
 */
export type ResizeEvent =
  | ColumnResizeEvent
  | ContainerResizeEvent
  | ViewportResizeEvent;

/**
 * 调整大小事件监听器
 */
export interface ResizeEventListener {
  /** 列调整大小监听器 */
  onColumnResize?: (event: ColumnResizeEvent) => void;
  /** 容器调整大小监听器 */
  onContainerResize?: (event: ContainerResizeEvent) => void;
  /** 视窗调整大小监听器 */
  onViewportResize?: (event: ViewportResizeEvent) => void;
  /** 通用调整大小监听器 */
  onResize?: (event: ResizeEvent) => void;
}

/**
 * 调整大小配置
 */
export interface ResizeConfig {
  /** 是否启用调整大小检测 */
  enabled?: boolean;
  /** 防抖延迟 (ms) */
  debounceDelay?: number;
  /** 是否检测列调整大小 */
  detectColumnResize?: boolean;
  /** 是否检测容器调整大小 */
  detectContainerResize?: boolean;
  /** 是否检测视窗调整大小 */
  detectViewportResize?: boolean;
  /** 最小变化阈值 */
  threshold?: {
    width?: number;
    height?: number;
  };
  /** 事件监听器 */
  listeners?: ResizeEventListener;
}

/**
 * 调整大小工具函数
 */
export interface ResizeHelpers {
  /** 创建调整大小事件 */
  createResizeEvent: {
    column: (
      params: Omit<ColumnResizeEvent, 'type' | 'timestamp' | 'deltaWidth'>,
    ) => ColumnResizeEvent;
    container: (
      params: Omit<ContainerResizeEvent, 'type' | 'timestamp' | 'deltaSize'>,
    ) => ContainerResizeEvent;
    viewport: (
      params: Omit<ViewportResizeEvent, 'type' | 'timestamp' | 'deltaViewport'>,
    ) => ViewportResizeEvent;
  };

  /** 防抖调整大小处理器 */
  debounceResize: <T extends ResizeEvent>(
    handler: (event: T) => void,
    delay: number,
  ) => (event: T) => void;

  /** 检测尺寸变化 */
  detectSizeChange: (
    oldSize: { width: number; height: number },
    newSize: { width: number; height: number },
    threshold?: { width?: number; height?: number },
  ) => boolean;

  /** 计算响应式断点 */
  getResponsiveBreakpoint: (
    width: number,
  ) => 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

  /** 获取容器尺寸 */
  getContainerSize: (element: HTMLElement) => { width: number; height: number };

  /** 获取视窗尺寸 */
  getViewportSize: () => { width: number; height: number };
}

/**
 * 调整大小观察器状态
 */
export interface ResizeObserverState {
  /** 是否正在观察 */
  isObserving: boolean;
  /** 观察的元素 */
  targetElement: HTMLElement | null;
  /** 当前尺寸 */
  currentSize: {
    width: number;
    height: number;
  };
  /** 上次调整大小时间 */
  lastResizeTime: number;
  /** 调整大小历史 */
  resizeHistory: ResizeEvent[];
}
