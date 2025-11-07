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

import type { ScrollConfig } from '@/custom-table/types/core/common';
import { useMemo } from 'react';

/**
 * 自动计算 scroll.y 配置
 */
export interface AutoScrollYConfig {
  /** 是否启用自动计算，默认 true */
  enabled?: boolean;
  /** 固定高度偏移量（像素），默认 350 */
  offset?: number;
  /** 最小高度（像素），防止表格过小，默认 300 */
  minHeight?: number;
  /** 最大高度（像素），防止表格过大，默认 undefined */
  maxHeight?: number;
}

/**
 * 使用 CSS calc() 表达式计算 scroll.y
 *
 * @description
 * 使用 CSS calc() 表达式的优势：
 * 1. 浏览器原生支持，性能更好
 * 2. 自动响应视口变化，无需 resize 监听
 * 3. 避免额外的 reflow/repaint
 * 4. 支持 CSS min/max/clamp 函数实现边界限制
 */
export const useAutoScrollYWithCalc = (
  config: AutoScrollYConfig = {},
  userScroll?: ScrollConfig,
): ScrollConfig => {
  const { offset = 350, enabled = true, minHeight = 300, maxHeight } = config;

  return useMemo<ScrollConfig>(() => {
    if (!enabled) {
      return userScroll || {};
    }

    const baseScroll: ScrollConfig = {
      x: userScroll?.x !== undefined ? userScroll.x : 'max-content',
    };

    // 如果用户已设置 scroll.y，优先使用用户配置
    if (userScroll?.y !== undefined) {
      return {
        ...baseScroll,
        y: userScroll.y,
      };
    }

    // 构建 calc() 表达式
    let calcExpression = `calc(100vh - ${offset}px)`;

    // 使用 CSS 数学函数实现边界限制
    if (minHeight !== undefined && maxHeight !== undefined) {
      // 同时有最小和最大限制：clamp(min, preferred, max)
      calcExpression = `clamp(${minHeight}px, calc(100vh - ${offset}px), ${maxHeight}px)`;
    } else if (minHeight !== undefined) {
      // 只有最小限制：max(min, preferred)
      calcExpression = `max(${minHeight}px, calc(100vh - ${offset}px))`;
    } else if (maxHeight !== undefined) {
      // 只有最大限制：min(preferred, max)
      calcExpression = `min(calc(100vh - ${offset}px), ${maxHeight}px)`;
    }

    return {
      ...baseScroll,
      y: calcExpression,
    };
  }, [enabled, userScroll, offset, minHeight, maxHeight]);
};

/**
 * 简化版本：直接返回自动计算的 scroll 配置
 */
export const useAutoScrollY = useAutoScrollYWithCalc;
