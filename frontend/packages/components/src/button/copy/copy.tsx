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

import { Button, Message } from '@arco-design/web-react';
import { IconCopy } from '@arco-design/web-react/icon';
import type React from 'react';
import { CCopyComponent } from './c-copy';

export interface CCopyButtonProps {
  /**
   * 要复制的文本内容
   */
  text: string;
  /**
   * 按钮文案
   */
  children?: React.ReactNode;
  /**
   * 按钮类型
   */
  type?: 'primary' | 'secondary' | 'outline' | 'dashed' | 'text';
  /**
   * 按钮尺寸
   */
  size?: 'mini' | 'small' | 'default' | 'large';
  /**
   * 是否只显示图标
   */
  iconOnly?: boolean;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 复制成功回调
   */
  onCopySuccess?: (text: string) => void;
  /**
   * 复制失败回调
   */
  onCopyError?: (error: any) => void;
}

/**
 * 复制按钮组件
 * @description 基于CCopy组件封装的复制按钮，点击即可复制文本内容
 */
export const CopyButton: React.FC<CCopyButtonProps> = ({
  text,
  children = '复制',
  type = 'outline',
  size = 'small',
  iconOnly = false,
  style,
  className,
  onCopySuccess,
  onCopyError,
}) => {
  const handleCopy = (copiedText: string, result: boolean) => {
    if (result) {
      Message.success('复制成功');
      onCopySuccess?.(copiedText);
    } else {
      Message.error('复制失败');
      onCopyError?.(new Error('复制失败'));
    }
  };

  return (
    <CCopyComponent
      text={text}
      onCopy={handleCopy}
      triggerEle={
        <Button
          type={type}
          size={size}
          icon={<IconCopy />}
          style={style}
          className={className}
        >
          {!iconOnly && children}
        </Button>
      }
      successMessage=""
      failMessage=""
      arcoPopoverProps={{
        disabled: true,
        content: null,
        popupVisible: false,
      }}
    />
  );
};
