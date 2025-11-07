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
 * FooterActions - 向导底部操作区（拆分组件）
 * @description 统一渲染“上一步 / 下一步”按钮及左右扩展区，提升复用与可读性
 */

import { Button, Space, Typography } from '@arco-design/web-react';
import { IconLeft, IconRight } from '@arco-design/web-react/icon';
import type React from 'react';

const { Text } = Typography;

export interface FooterActionsProps {
  // 左侧“上一步”按钮控制
  showPrev: boolean;
  prevText: string;
  onPrev: () => void;

  // 右侧“下一步”按钮控制
  canProceed: boolean;
  nextText: string;
  onNext: () => void;

  // 右侧步骤进度显示（可选）
  stepProgressText?: string;

  // 扩展插槽
  leftExtras?: React.ReactNode;
  rightExtras?: React.ReactNode;

  // 样式类名
  className?: string;
}

/**
 * 统一底部操作区域
 */
export const FooterActions: React.FC<FooterActionsProps> = ({
  showPrev,
  prevText,
  onPrev,
  canProceed,
  nextText,
  onNext,
  stepProgressText,
  leftExtras,
  rightExtras,
  className,
}) => {
  return (
    <div className={className}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* 左侧区域 */}
        <div>
          {showPrev && (
            <Button onClick={onPrev} icon={<IconLeft />}>
              {prevText}
            </Button>
          )}
          {leftExtras}
        </div>

        {/* 右侧区域 */}
        <div>
          <Space>
            {stepProgressText ? (
              <Text type="secondary">{stepProgressText}</Text>
            ) : null}
            {rightExtras}
            <Button
              type="primary"
              disabled={!canProceed}
              onClick={onNext}
              title={!canProceed ? '请完成当前步骤的必填项' : ''}
            >
              {nextText}
              <IconRight style={{ marginLeft: 4 }} />
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default FooterActions;
