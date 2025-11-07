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
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { logger } from '@veaiops/utils';

/**
 * 检查 App ID 是否重复
 * @param appId - 待检查的 App ID
 * @returns 如果重复返回错误消息，否则返回 undefined
 */
export const checkAppIdDuplicate = async (
  appId: string,
): Promise<string | undefined> => {
  // 如果 App ID 为空，不进行检查
  if (!appId || appId.trim() === '') {
    return undefined;
  }

  try {
    // 调用 API 获取机器人列表（limit 为 1000）
    const response = await apiClient.bots.getApisV1ManagerSystemConfigBots({
      limit: 1000,
    });

    // 检查 API 响应是否成功
    if (
      response.code === API_RESPONSE_CODE.SUCCESS &&
      response.data &&
      Array.isArray(response.data)
    ) {
      // 检查是否存在相同的 bot_id
      const isDuplicate = response.data.some(
        (bot) => bot.bot_id === appId.trim(),
      );

      if (isDuplicate) {
        return '该 App ID 已被使用，请使用其他 App ID';
      }
    }

    // 没有重复，返回 undefined
    return undefined;
  } catch (error) {
    // 错误处理：记录日志但不阻止用户继续操作
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({
      message: '检查 App ID 重复失败',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
        appId,
      },
      source: 'useBotCreateForm',
      component: 'checkAppIdDuplicate',
    });
    // 网络错误时，不阻止用户继续操作，返回 undefined
    return undefined;
  }
};
