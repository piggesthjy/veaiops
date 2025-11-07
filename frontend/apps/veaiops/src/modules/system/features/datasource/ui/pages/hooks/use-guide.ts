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

import type { IGuide } from '@veaiops/components';

import { useEffect, useMemo, useState } from 'react';
import {
  GUIDE_CONFIG_CONSTANTS,
  MONITOR_MANAGEMENT_GUIDE_STEPS,
} from '../config/guide-config';

/**
 * 监控管理页面引导逻辑 Hook
 *
 * @description
 * 封装引导组件的状态管理和配置逻辑
 *
 * @returns 引导配置对象
 */
export const useGuide = () => {
  const [guideVisible, setGuideVisible] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return (
      !urlParams.has('connectDrawerShow') ||
      urlParams.get('connectDrawerShow') !== 'true'
    );
  });

  // 等待DOM渲染完成后再显示引导
  useEffect(() => {
    // 检查目标元素是否存在的函数
    const checkTargetElements = () => {
      const connectionBtn = document.querySelector(
        '#monitor-connection-manage-btn',
      );
      const addConfigBtn = document.querySelector('#monitor-add-config-btn');

      return connectionBtn && addConfigBtn;
    };

    // 使用 requestAnimationFrame 确保DOM已渲染
    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const attemptShowGuide = (attempt = 1) => {
      rafId = requestAnimationFrame(() => {
        if (checkTargetElements()) {
          // 添加额外的延迟，确保布局完全稳定
          // 等待所有CSS动画、过渡效果和布局计算完成
          timeoutId = setTimeout(() => {
            const connectionBtn = document.querySelector(
              '#monitor-connection-manage-btn',
            );

            const connectionRect = connectionBtn?.getBoundingClientRect();

            // 确保元素有实际的尺寸（不是display:none或visibility:hidden）
            if (
              connectionRect &&
              connectionRect.width > 0 &&
              connectionRect.height > 0
            ) {
              const urlParams = new URLSearchParams(window.location.search);
              const connectDrawerShow =
                !urlParams.has('connectDrawerShow') ||
                urlParams.get('connectDrawerShow') !== 'true';
              setGuideVisible(connectDrawerShow);

              // 显示引导后，再次延迟一小段时间，让 XGuide 组件完全初始化
              // 然后触发一个 resize 事件，强制 XGuide 重新计算位置
              setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
              }, 100);
            }
          }, 300); // 延迟300ms确保布局稳定
        } else if (attempt < 20) {
          // 最多尝试20次，每次间隔50ms

          timeoutId = setTimeout(() => attemptShowGuide(attempt + 1), 50);
        }
      });
    };

    attemptShowGuide();

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const guideConfig: IGuide = useMemo(
    () => ({
      steps: MONITOR_MANAGEMENT_GUIDE_STEPS,
      type: GUIDE_CONFIG_CONSTANTS.TYPE,
      theme: GUIDE_CONFIG_CONSTANTS.THEME,
      mask: true,
      maskStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
      arrow: true,
      hotspot: true,
      closable: false,
      visible: guideVisible,
      localKey: GUIDE_CONFIG_CONSTANTS.LOCAL_KEY,
      showStepInfo: true,
      showPreviousBtn: true,
      nextText: GUIDE_CONFIG_CONSTANTS.NEXT_TEXT,
      prevText: GUIDE_CONFIG_CONSTANTS.PREV_TEXT,
      okText: GUIDE_CONFIG_CONSTANTS.OK_TEXT,
      maskClosable: false,
      zIndex: 1400,
      onClose: () => {
        setGuideVisible(false);
      },
    }),
    [guideVisible],
  );

  return guideConfig;
};
