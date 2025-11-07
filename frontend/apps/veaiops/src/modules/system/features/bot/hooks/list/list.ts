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

import apiClient from '@/utils/api-client';
import { Message } from '@arco-design/web-react';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { logger } from '@veaiops/utils';
import type { Bot } from 'api-generate';
import { useCallback, useEffect, useState } from 'react';

/**
 * 机器人列表管理自定义Hook
 * @description 封装机器人列表相关的状态和逻辑
 * @note 优化：直接使用 api-generate 中的 Bot 类型，避免自定义重复类型
 */
export const useBotList = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取机器人列表
  const fetchBots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bots.getApisV1ManagerSystemConfigBots(
        {},
      );

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        // 直接使用API返回的Bot类型数据，无需转换
        setBots(response.data);
      } else {
        Message.error({
          content: response.message || '获取机器人列表失败',
          duration: 3000,
        });
        setBots([]);
      }
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: 'Failed to fetch bot list',
        data: { error: errorObj },
        source: 'useBotList',
        component: 'fetchBots',
      });
      Message.error({ content: '获取机器人列表失败，请重试', duration: 3000 });
      setBots([]);
    } finally {
      // 操作完成
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  return {
    bots,
    loading,
    fetchBots,
  };
};
