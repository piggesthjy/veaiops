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

import { Tooltip } from '@arco-design/web-react';
import { IconCheckCircle } from '@arco-design/web-react/icon';
import type React from 'react';
import { useEffect, useState } from 'react';
import styles from './update-tooltip.module.less';

interface UpdateTooltipProps {
  children: React.ReactNode;
  show: boolean;
  message: string;
  duration?: number;
  onHide?: () => void;
}

/**
 * 数据更新提示Tooltip组件
 * 提供优雅的视觉反馈，告知用户数据已更新
 */
export const UpdateTooltip: React.FC<UpdateTooltipProps> = ({
  children,
  show,
  message,
  duration = 3000,
  onHide,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);

      // 自动隐藏
      const timer = setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      return undefined;
    }
  }, [show, duration, onHide]);

  return (
    <Tooltip
      content={
        <div className={styles.updateTooltipContent}>
          <IconCheckCircle className={styles.updateTooltipIcon} />
          <span className={styles.updateTooltipText}>{message}</span>
        </div>
      }
      position="top"
      popupVisible={visible}
      className={styles.updateTooltip}
    >
      {children}
    </Tooltip>
  );
};

export default UpdateTooltip;
