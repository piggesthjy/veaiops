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

import type { VirtualListHandle } from '@arco-design/web-react/es/_class/VirtualList';
/**
 * 虚拟滚动插件类型定义
 * 基于 Arco Table VirtualList 能力
 */
import type { RefObject } from 'react';

/**
 * 虚拟滚动配置
 */
export interface VirtualScrollConfig {
  /** 是否启用插件 */
  enabled?: boolean;
  /** 插件优先级 */
  priority?: number;
  /** 虚拟滚动容器高度 */
  height?: number | string;
  /** 每项的高度 */
  itemHeight?: number | ((index: number) => number);
  /** 缓冲区大小 */
  buffer?: number;
  /** 是否启用水平虚拟滚动 */
  horizontal?: boolean;
  /** 阈值，超过此数量才启用虚拟滚动 */
  threshold?: number;
  /** 滚动到指定位置的回调 */
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  /** 滚动到顶部的回调 */
  onScrollToTop?: () => void;
  /** 滚动到底部的回调 */
  onScrollToBottom?: () => void;
}

/**
 * 虚拟滚动方法
 */
export interface VirtualScrollMethods {
  /** 滚动到指定索引 */
  scrollToIndex: (index: number) => void;
  /** 滚动到指定位置 */
  scrollTo: (scrollTop: number) => void;
  /** 获取当前滚动位置 */
  getScrollOffset: () => { scrollTop: number; scrollLeft: number };
  /** 刷新虚拟列表 */
  refresh: () => void;
}

/**
 * 插件状态
 */
export interface VirtualScrollState {
  /** 是否启用虚拟滚动 */
  isVirtualEnabled: boolean;
  /** 虚拟列表引用 */
  virtualListRef: RefObject<VirtualListHandle>;
  /** 可见范围 */
  visibleRange: {
    start: number;
    end: number;
  };
  /** 当前滚动位置 */
  scrollOffset: {
    top: number;
    left: number;
  };
  /** 总数据量 */
  totalCount: number;
  /** 可见数据量 */
  visibleCount: number;
}
