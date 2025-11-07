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

// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the Apache License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * 脱敏渲染组件
 * 用于安全地显示敏感信息，支持复制、显示/隐藏、刷新功能
 */

import { Button, Message, Tooltip, Typography } from '@arco-design/web-react';
import {
  IconCopy,
  IconEye,
  IconEyeInvisible,
  IconRefresh,
} from '@arco-design/web-react/icon';
import { logger, safeCopyToClipboard } from '@veaiops/utils';
import { useState } from 'react';

// 公共工具：安全复制（优先使用 Clipboard API，失败回退 execCommand）
// 相对路径从当前文件到 frontend/packages/utils/src/tools/common.ts

const { Text } = Typography;

interface MaskedRendererProps {
  value: string;
  label?: string;
  maskLength?: number;
  onRefresh?: () => void;
  className?: string;
}

/**
 * 脱敏渲染组件
 * 提供复制、显示/隐藏、刷新功能
 */
export const MaskedRenderer = ({
  value,
  label: _label = 'Secret',
  maskLength = 8,
  onRefresh,
  className = '',
}: MaskedRendererProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // 生成脱敏字符串
  const generateMaskedValue = (val: string) => {
    if (!val) {
      return '';
    }
    const visibleLength = Math.min(maskLength, val.length);
    const maskedLength = Math.max(val.length - visibleLength, 4);
    const visiblePart = val.slice(0, visibleLength);
    const maskedPart = '*'.repeat(maskedLength);
    return `${visiblePart}${maskedPart}`;
  };

  // 复制到剪贴板（使用公共工具 safeCopyToClipboard），在 UI 层做用户提示与日志
  /**
   * 复制到剪贴板
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  const handleCopy = async (): Promise<{ success: boolean; error?: Error }> => {
    // ✅ 正确：检查 safeCopyToClipboard 的返回值
    const result = await safeCopyToClipboard(value);

    if (result.success) {
      Message.success('已复制到剪贴板');
      return { success: true };
    } else {
      const error = result.error || new Error('复制失败');
      // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
      logger.error({
        message: 'safeCopyToClipboard 复制失败',
        data: {
          error: error.message,
          stack: error.stack,
          timestamp: Date.now(),
          errorObj: error,
        },
        source: 'MaskedRenderer',
        component: 'handleCopy',
      });
      // 错误处理：透出错误信息
      const errorMessage = error.message || '复制失败';
      Message.error(errorMessage);
      return { success: false, error };
    }
  };

  // 切换显示/隐藏
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // 刷新/重新生成
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      Message.info('刷新功能暂未实现');
    }
  };

  if (!value) {
    return <Text type="secondary">-</Text>;
  }

  const displayValue = isVisible ? value : generateMaskedValue(value);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 脱敏值显示 */}
      <div className="flex-1 min-w-0">
        <Text
          className="font-mono text-xs select-all"
          style={{
            wordBreak: 'break-all',
            lineHeight: '1.4',
          }}
        >
          {displayValue}
        </Text>
      </div>

      {/* 操作按钮组 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* 复制按钮 */}
        <Tooltip content="复制">
          <Button
            type="text"
            size="mini"
            icon={<IconCopy />}
            onClick={handleCopy}
            className="h-6 w-6 p-0"
          />
        </Tooltip>

        {/* 显示/隐藏切换按钮 */}
        <Tooltip content={isVisible ? '隐藏' : '显示'}>
          <Button
            type="text"
            size="mini"
            icon={isVisible ? <IconEyeInvisible /> : <IconEye />}
            onClick={toggleVisibility}
            className="h-6 w-6 p-0"
          />
        </Tooltip>

        {/* 刷新按钮 */}
        {onRefresh && (
          <Tooltip content="刷新">
            <Button
              type="text"
              size="mini"
              icon={<IconRefresh />}
              onClick={handleRefresh}
              className="h-6 w-6 p-0"
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};
