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

import type React from 'react';
import { ComingSoonPage } from './coming-soon-page';

interface WithComingSoonOptions {
  /** 页面标题 */
  title?: string;
  /** 页面描述 */
  description?: string;
  /** 是否启用 ComingSoon 模式，默认为 true */
  enabled?: boolean;
}

/**
 * ComingSoon HOC - 用于临时显示 ComingSoon 页面而不污染业务代码
 * @param WrappedComponent 被包装的组件
 * @param options 配置选项
 * @returns 包装后的组件
 */
export function withComingSoon<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithComingSoonOptions = {},
) {
  const {
    title = '功能开发中',
    description = '此功能正在开发中，敬请期待',
    enabled = true,
  } = options;

  const WithComingSoonComponent: React.FC<P> = (props) => {
    // 如果启用了 ComingSoon 模式，显示 ComingSoon 页面
    if (enabled) {
      return <ComingSoonPage title={title} description={description} />;
    }

    // 否则渲染原始组件
    return <WrappedComponent {...props} />;
  };

  // 设置显示名称，便于调试
  WithComingSoonComponent.displayName = `withComingSoon(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithComingSoonComponent;
}

export default withComingSoon;
