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
 * StreamRetryButton 组件类型定义
 * 从 components/stream-retry-button/types.ts 迁移而来
 */

/**
 * @name 流式加载重试按钮属性
 */
export interface StreamRetryButtonProps {
  /** @name 是否正在重试 */
  isRetrying?: boolean;
  /** @name 是否有错误 */
  hasError?: boolean;
  /** @name 错误类型 */
  errorType?: 'rate_limit' | 'concurrency_limit' | 'timeout' | 'unknown';
  /** @name 是否需要继续加载 */
  needContinue?: boolean;
  /** @name 重试回调 */
  onRetry?: () => void;
  /** @name 自动重试延迟时间 */
  autoRetryDelay?: number;
  /** @name 容器样式类名 */
  className?: string;
  /** @name 是否有更多数据 */
  hasMoreData?: boolean;
  /** @name 加载更多数据回调 */
  onLoadMore?: () => void;
}

/**
 * 重试配置
 */
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  autoRetry?: boolean;
}
