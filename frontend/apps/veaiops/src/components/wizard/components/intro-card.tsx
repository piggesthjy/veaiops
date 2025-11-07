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
 * 步骤卡片组件
 * @description 展示单个向导步骤的卡片，支持不同状态（未开始、进行中、已完成）
 * @author AI Assistant
 * @date 2025-01-15
 */

import { IconCheck } from '@arco-design/web-react/icon';
import type React from 'react';
import styles from './intro-card.module.less';

export enum StepStatus {
  PENDING = 'pending', // 未开始
  ACTIVE = 'active', // 进行中
  COMPLETED = 'completed', // 已完成
}

export interface IntroCardProps {
  /** 步骤索引（从0开始） */
  index: number;
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  description: string;
  /** 步骤状态 */
  status: StepStatus;
  /** 是否显示连接线（最后一个步骤不显示） */
  showConnector?: boolean;
}

/**
 * 步骤卡片组件
 */
export const IntroCard: React.FC<IntroCardProps> = ({
  index,
  title,
  description,
  status,
  showConnector = true,
}) => {
  const isActive = status === StepStatus.ACTIVE;
  const isCompleted = status === StepStatus.COMPLETED;
  const isPending = status === StepStatus.PENDING;

  return (
    <div
      className={`${styles.introCard} ${
        isActive ? styles.active : ''
      } ${isCompleted ? styles.completed : ''} ${
        isPending ? styles.pending : ''
      }`}
    >
      {/* 顶部装饰条 */}
      <div className={styles.topDecorator} />

      {/* 步骤图标区域 */}
      <div className={styles.iconSection}>
        <div className={styles.iconCircle}>
          <div className={styles.iconInner}>
            {isCompleted ? (
              <IconCheck className={styles.checkIcon} />
            ) : (
              <span className={styles.stepNumber}>{index + 1}</span>
            )}
          </div>
        </div>

        {/* 脉动动画圈（仅在active状态显示） */}
        {isActive && <div className={styles.pulseRing} />}
      </div>

      {/* 文字内容区域 */}
      <div className={styles.contentSection}>
        <div className={styles.stepLabel}>第{index + 1}步</div>
        <h3 className={styles.stepTitle}>{title}</h3>
        <p className={styles.stepDescription}>{description}</p>
      </div>

      {/* 步骤连接线 */}
      {showConnector && (
        <div className={styles.connectorWrapper}>
          <div
            className={`${styles.connector} ${
              isCompleted ? styles.completed : ''
            }`}
          >
            <div className={styles.connectorLine} />
            <div className={styles.connectorDot} />
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroCard;
