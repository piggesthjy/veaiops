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

import { TAB_KEYS } from '@datasource/lib';
import { useSearchParams } from '@modern-js/runtime/router';
import { useSubscription } from '@veaiops/components';
import { logger } from '@veaiops/utils';
import { useCallback, useEffect } from 'react';

/**
 * Tab 管理 Hook
 * 职责：管理 Tab 的切换和 URL 状态同步
 */
export const useTabManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { channels, createChannel } = useSubscription();

  // 确保 activeKeyChange 通道已创建
  useEffect(() => {
    createChannel('activeKeyChange');
  }, [createChannel]);

  // 从URL读取activeTab参数，没有则使用默认值
  const activeTab = searchParams.get('activeTab') || TAB_KEYS.VOLCENGINE;

  // 监控 activeTab 变化
  useEffect(() => {
    logger.info({
      message: '[useTabManagement] activeTab 值变化',
      data: {
        activeTab,
        urlActiveTab: searchParams.get('activeTab'),
        defaultTab: TAB_KEYS.VOLCENGINE,
        currentUrl: window.location.href,
      },
      source: 'useTabManagement',
      component: 'activeTab-effect',
    });
  }, [activeTab, searchParams]);

  // 处理Tab切换
  const handleTabChange = useCallback(
    (key: string) => {
      logger.info({
        message: '[useTabManagement] handleTabChange 被调用',
        data: {
          key,
          currentActiveTab: activeTab,
          isSameTab: key === activeTab,
          tabKeys: TAB_KEYS,
        },
        source: 'useTabManagement',
        component: 'handleTabChange',
      });

      // 更新URL参数
      logger.info({
        message: '[useTabManagement] 准备更新 URL 参数',
        data: {
          key,
          currentSearchParams: Object.fromEntries(searchParams.entries()),
        },
        source: 'useTabManagement',
        component: 'handleTabChange',
      });

      setSearchParams({ activeTab: key });

      logger.info({
        message: '[useTabManagement] URL 参数已更新',
        data: {
          key,
        },
        source: 'useTabManagement',
        component: 'handleTabChange',
      });

      // 发布activeKey变化事件
      if (channels.activeKeyChange) {
        logger.info({
          message: '[useTabManagement] 发布 activeKey 变化事件',
          data: {
            key,
            hasChannel: Boolean(channels.activeKeyChange),
          },
          source: 'useTabManagement',
          component: 'handleTabChange',
        });

        channels.activeKeyChange.publish({ activeKey: key });

        logger.info({
          message: '[useTabManagement] activeKey 变化事件已发布',
          data: {
            key,
          },
          source: 'useTabManagement',
          component: 'handleTabChange',
        });
      } else {
        logger.warn({
          message: '[useTabManagement] activeKeyChange 通道不存在',
          data: {
            key,
            availableChannels: Object.keys(channels),
          },
          source: 'useTabManagement',
          component: 'handleTabChange',
        });
      }
    },
    [channels, setSearchParams, activeTab, searchParams],
  );

  return {
    activeTab,
    handleTabChange,
  };
};
