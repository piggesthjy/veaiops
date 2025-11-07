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
 * 步骤指示器组件
 * @description 展示当前向导的步骤进度
 * @author AI Assistant
 * @date 2025-01-15
 */

import { IconLeft, IconRight } from '@arco-design/web-react/icon';
import React from 'react';
import { DATA_SOURCE_CONFIGS } from '../config/datasource-configs';
import type { DataSourceType } from '../types';
import { IntroCard, StepStatus } from './intro-card';
import styles from './step-indicator.module.less';

export interface StepIndicatorProps {
  selectedType: DataSourceType | null;
  currentStep: number;
}

/**
 * 获取步骤状态
 */
const getStepStatus = (index: number, currentStep: number): StepStatus => {
  if (index < currentStep) {
    return StepStatus.COMPLETED;
  }
  if (index === currentStep) {
    return StepStatus.ACTIVE;
  }
  return StepStatus.PENDING;
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  selectedType,
  currentStep,
}) => {
  // ✅ 所有 Hooks 必须在组件顶层调用，在任何条件判断之前
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // 检查滚动状态
  const checkScrollState = React.useCallback(() => {
    if (!scrollRef.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // 滚动到指定位置
  const scrollTo = React.useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) {
      return;
    }

    const scrollAmount = 280; // 一个卡片的宽度
    const currentScroll = scrollRef.current.scrollLeft;
    const newScroll =
      direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    scrollRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  }, []);

  // 滚动到当前步骤
  const scrollToCurrentStep = React.useCallback(() => {
    if (!scrollRef.current) {
      return;
    }

    const stepWidth = 280; // 卡片宽度
    const scrollAmount = currentStep * stepWidth;

    scrollRef.current.scrollTo({
      left: scrollAmount,
      behavior: 'smooth',
    });
  }, [currentStep]);

  // 监听滚动事件
  React.useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      checkScrollState();
      scrollElement.addEventListener('scroll', checkScrollState);

      return () => {
        scrollElement.removeEventListener('scroll', checkScrollState);
      };
    }
    return undefined;
  }, [checkScrollState]);

  // 当步骤改变时，滚动到当前步骤
  React.useEffect(() => {
    scrollToCurrentStep();
  }, [scrollToCurrentStep]);

  // ✅ 条件判断移到 Hooks 之后
  if (!selectedType) {
    return null;
  }

  const config = DATA_SOURCE_CONFIGS.find((c) => c.type === selectedType);
  if (!config) {
    return null;
  }

  return (
    <div className={styles.stepsContainer}>
      {/* 左箭头 */}
      <button
        className={`${styles.scrollArrow} ${styles.left} ${
          !canScrollLeft ? styles.disabled : ''
        }`}
        onClick={() => scrollTo('left')}
        disabled={!canScrollLeft}
        aria-label="向左滚动"
      >
        <IconLeft className={styles.arrowIcon} />
      </button>

      {/* 右箭头 */}
      <button
        className={`${styles.scrollArrow} ${styles.right} ${
          !canScrollRight ? styles.disabled : ''
        }`}
        onClick={() => scrollTo('right')}
        disabled={!canScrollRight}
        aria-label="向右滚动"
      >
        <IconRight className={styles.arrowIcon} />
      </button>

      <div className={styles.stepsWrapper} ref={scrollRef}>
        {config.steps.map((step, index) => (
          <div key={step.key} className={styles.stepItem}>
            <IntroCard
              index={index}
              title={step.title}
              description={step.description}
              status={getStepStatus(index, currentStep)}
              showConnector={false}
            />
            {/* 所有步骤都有连接器容器，最后一个设为不可见以保持宽度一致 */}
            <div
              className={`${styles.connectorWrapper} ${
                index >= config.steps.length - 1 ? styles.hidden : ''
              }`}
            >
              <div
                className={`${styles.connector} ${
                  getStepStatus(index, currentStep) === StepStatus.COMPLETED
                    ? styles.completed
                    : ''
                }`}
              >
                <div className={styles.connectorLine} />
                <div className={styles.connectorDot} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
