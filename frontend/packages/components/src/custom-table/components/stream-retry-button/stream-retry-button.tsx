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

import {
  Button,
  Progress,
  Space,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import {
  IconLoading,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import './index.less';

import type { StreamRetryButtonProps } from '@/custom-table/types';

const { Text } = Typography;

/**
 * 流式加载重试按钮组件
 * 专门为处理Argos流式加载中的限流错误设计
 */
const StreamRetryButton: React.FC<StreamRetryButtonProps> = ({
  isRetrying,
  hasError,
  errorType = 'unknown',
  needContinue = false,
  onRetry,
  autoRetryDelay = 3,
  className = '',
  hasMoreData = true,
  onLoadMore,
}) => {
  const [countdown, setCountdown] = useState(autoRetryDelay);
  const [isAutoRetrying, setIsAutoRetrying] = useState(
    hasError && autoRetryDelay > 0,
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 执行重试
  const handleRetry = useCallback(() => {
    clearTimer();
    setIsAutoRetrying(false);
    onRetry?.();
  }, [onRetry, clearTimer]);

  // 自动重试逻辑
  useEffect(() => {
    if (hasError && isAutoRetrying && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (hasError && isAutoRetrying && countdown === 0) {
      handleRetry();
    }

    return () => clearTimer();
  }, [hasError, isAutoRetrying, countdown, handleRetry, clearTimer]);

  // 重置状态
  useEffect(() => {
    if (hasError) {
      setCountdown(autoRetryDelay);
      setIsAutoRetrying(autoRetryDelay > 0);
    } else {
      setIsAutoRetrying(false);
    }
  }, [hasError, autoRetryDelay]);

  // 不同错误类型的文案
  const getErrorText = () => {
    switch (errorType) {
      case 'rate_limit':
        return '请求频率超限，正在自动重试...';
      case 'concurrency_limit':
        return '并发请求超限，正在自动重试...';
      case 'timeout':
        return '请求超时，请点击重试';
      default:
        return '加载失败，请点击重试';
    }
  };

  // 进度条计算
  const progressPercent = Math.round(
    ((autoRetryDelay - countdown) / autoRetryDelay) * 100,
  );

  if (!hasError && !isRetrying) {
    // 正常状态，显示加载更多按钮
    const handleClick = onLoadMore || onRetry;

    if (!hasMoreData) {
      return null;
    }

    return (
      <div className={`stream-retry-button ${className}`} onClick={handleClick}>
        <IconSearch />
        <span>{needContinue ? '继续搜索更多数据' : '加载更多'}</span>
      </div>
    );
  }

  if (isRetrying) {
    // 加载中状态
    return (
      <div className={`stream-retry-button loading ${className}`}>
        <IconLoading />
        <span>加载中...</span>
      </div>
    );
  }

  // 错误状态，显示重试按钮
  return (
    <div className={`stream-retry-button error ${className}`}>
      {isAutoRetrying ? (
        <div className="auto-retry-container">
          <Text type="warning">{getErrorText()}</Text>
          <div className="retry-progress-container">
            <Progress
              percent={progressPercent}
              showText={false}
              status="warning"
              size="small"
            />
            <Text className="countdown-text">{countdown}秒后重试</Text>
          </div>
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<IconRefresh />}
              onClick={handleRetry}
            >
              立即重试
            </Button>
            <Button size="small" onClick={() => setIsAutoRetrying(false)}>
              取消自动重试
            </Button>
          </Space>
        </div>
      ) : (
        <Space>
          <Text type="warning">{getErrorText()}</Text>
          <Tooltip content="点击重试">
            <Button type="primary" icon={<IconRefresh />} onClick={handleRetry}>
              重试
            </Button>
          </Tooltip>
        </Space>
      )}
    </div>
  );
};

export { StreamRetryButton };
