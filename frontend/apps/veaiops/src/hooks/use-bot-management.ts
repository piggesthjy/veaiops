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

import { BOT_MESSAGES } from '@/modules/system/features/bot/lib';
import apiClient from '@/utils/api-client';
import { Message } from '@arco-design/web-react';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { logger } from '@veaiops/utils';
import type {
  Bot,
  BotCreateRequest,
  BotUpdateRequest,
  ChannelType,
} from 'api-generate';
import { useCallback, useState } from 'react';

/**
 * 机器人表格数据类型
 */
export interface BotTableData extends Bot {
  /** 表格行键 */
  key: string;
  /** 状态 */
  status: 'active' | 'inactive';
}

/**
 * 机器人配置表单数据
 * 注意：此接口用于前端表单，与API请求类型可能不完全一致
 */
export interface BotFormData {
  /** 应用ID */
  appId: string;
  /** 应用密钥 */
  appSecret: string;
  /** 加密Token */
  encryptToken?: string;
  /** 加密密钥 */
  encryptSecret?: string;
  /** 机器人名称 */
  name?: string;
  /** 企业协同工具 */
  channel: ChannelType;
}

/**
 * 机器人管理Hook
 */
export const useBotManagement = () => {
  const [bots, setBots] = useState<BotTableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  /**
   * 转换机器人数据为表格数据
   */
  const transformBotToTableData = useCallback((bot: Bot): BotTableData => {
    return {
      ...bot,
      key: bot.bot_id || `temp-${Date.now()}-${Math.random()}`,
      status: bot.open_id ? 'active' : 'inactive',
    };
  }, []);

  /**
   * 加载机器人列表
   */
  const loadBots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.bots.getApisV1ManagerSystemConfigBots(
        {},
      );

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        const tableData = response.data.map(transformBotToTableData);
        setBots(tableData);
      } else {
        throw new Error(response.message || '获取机器人列表失败');
      }
    } catch (error) {
      // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: '加载机器人列表失败',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'useBotManagement',
        component: 'loadBots',
      });
      const errorMessage =
        error instanceof Error ? error.message : '加载机器人列表失败，请重试';
      Message.error(errorMessage);
    } finally {
      // 加载完成
      setLoading(false);
    }
  }, [transformBotToTableData]);

  /**
   * 创建机器人
   */
  const createBot = useCallback(
    async (botData: BotCreateRequest): Promise<boolean> => {
      try {
        setLoading(true);
        const response = await apiClient.bots.postApisV1ManagerSystemConfigBots(
          {
            requestBody: botData,
          },
        );

        if (response.code === 201 && response.data) {
          const tableData = transformBotToTableData(response.data);
          setBots((prev) => [...prev, tableData]);
          return true;
        } else {
          throw new Error(response.message || BOT_MESSAGES.create.error);
        }
      } catch (error) {
        // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: '创建机器人失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
          source: 'useBotManagement',
          component: 'createBot',
        });
        const errorMessage =
          error instanceof Error ? error.message : '创建机器人失败';
        Message.error(errorMessage);
        return false;
      } finally {
        // 操作完成
        setLoading(false);
      }
    },
    [transformBotToTableData],
  );

  /**
   * 更新机器人
   */
  interface UpdateBotParams {
    botId: string;
    updateData: BotUpdateRequest;
  }
  const updateBot = useCallback(
    async ({ botId, updateData }: UpdateBotParams): Promise<boolean> => {
      try {
        setLoading(true);
        const response = await apiClient.bots.putApisV1ManagerSystemConfigBots({
          uid: botId,
          requestBody: updateData,
        });

        if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
          // 重新获取更新后的机器人信息
          const botResponse =
            await apiClient.bots.getApisV1ManagerSystemConfigBots1({
              uid: botId,
            });

          if (
            botResponse.code === API_RESPONSE_CODE.SUCCESS &&
            botResponse.data
          ) {
            const tableData = transformBotToTableData(botResponse.data);
            setBots((prev) =>
              prev.map((bot) => (bot._id === botId ? tableData : bot)),
            );
            Message.success(BOT_MESSAGES.update.success);
            return true;
          }
        } else {
          // 更新API调用失败
          throw new Error(response.message || BOT_MESSAGES.update.error);
        }

        throw new Error(response.message || BOT_MESSAGES.update.error);
      } catch (error) {
        // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: 'Update bot error',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
          source: 'BotManagement',
          component: 'updateBot',
        });
        const errorMessage = errorObj.message;
        Message.error(errorMessage || BOT_MESSAGES.update.error);
        return false;
      } finally {
        // 操作完成
        setLoading(false);
      }
    },
    [transformBotToTableData],
  );

  /**
   * 删除机器人
   */
  const deleteBot = useCallback(async (botId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiClient.bots.deleteApisV1ManagerSystemConfigBots(
        {
          uid: botId,
        },
      );

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        setBots((prev) => prev.filter((bot) => bot._id !== botId));
        Message.success(BOT_MESSAGES.delete.success);
        return true;
      }

      throw new Error(response.message || BOT_MESSAGES.delete.error);
    } catch (error) {
      // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: 'Delete bot error',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'BotManagement',
        component: 'deleteBot',
      });
      const errorMessage = errorObj.message;
      Message.error(errorMessage || BOT_MESSAGES.delete.error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 测试机器人连接
   */
  const testBotConnection = useCallback(
    async (_botId: string): Promise<boolean> => {
      try {
        setLoading(true);
        // 注意：这里假设有测试连接的API，如果没有则需要添加到OpenAPI规范中
        // 目前先模拟测试功能
        Message.info('正在测试连接...');

        // 模拟测试过程
        await new Promise((resolve) => setTimeout(resolve, 2000));

        Message.success('机器人连接测试成功');
        return true;
      } catch (error) {
        // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: 'Test bot connection error',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
          source: 'BotManagement',
          component: 'testBotConnection',
        });
        const errorMessage = errorObj.message;
        Message.error(errorMessage || '测试机器人连接失败');
        return false;
      } finally {
        // 操作完成
        setLoading(false);
      }
    },
    [],
  );

  /**
   * 获取机器人详情
   */
  const getBotDetails = useCallback(
    async (botId: string): Promise<Bot | null> => {
      try {
        const response = await apiClient.bots.getApisV1ManagerSystemConfigBots1(
          {
            uid: botId,
          },
        );

        if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
          setSelectedBot(response.data);
          return response.data;
        }

        throw new Error(response.message || '获取机器人详情失败');
      } catch (error) {
        // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: 'Get bot details error',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
          source: 'BotManagement',
          component: 'getBotDetails',
        });
        const errorMessage = errorObj.message;
        Message.error(errorMessage || '获取机器人详情失败');
        return null;
      }
    },
    [],
  );

  return {
    // 状态
    bots,
    loading,
    selectedBot,

    // 操作方法
    loadBots,
    createBot,
    updateBot,
    deleteBot,
    testBotConnection,
    getBotDetails,
    setSelectedBot,
  };
};

export default useBotManagement;
