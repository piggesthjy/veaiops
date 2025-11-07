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
 * Bot API服务
 * 统一管理 Bot 和 Bot 属性相关的 API 调用
 */

import { API_RESPONSE_CODE } from '@veaiops/constants';
import apiClient from '@/utils/api-client';
import type {
  BotCreateRequest,
  BotUpdateRequest,
  ChannelType,
  AttributeKey,
  BotAttribute,
  BotAttributePayload,
} from 'api-generate';

/**
 * 获取Bot列表参数接口
 */
export interface GetBotsParams {
  skip?: number;
  limit?: number;
  name?: string;
  channel?: ChannelType;
}

/**
 * 获取Bot列表
 */
export const getBots = async (params: GetBotsParams = {}) => {
  const response = await apiClient.bots.getApisV1ManagerSystemConfigBots(
    params
  );
  return {
    data: response.data || [],
    total: response.data?.length || 0,
  };
};

/**
 * 删除Bot
 */
export const deleteBot = async (botId: string): Promise<boolean> => {
  const response = await apiClient.bots.deleteApisV1ManagerSystemConfigBots({
    uid: botId,
  });

  if (response.code === API_RESPONSE_CODE.SUCCESS) {
    return true;
  }

  throw new Error(response.message || "删除Bot失败");
};

/**
 * 创建Bot
 */
export const createBot = async (data: BotCreateRequest) => {
  const response = await apiClient.bots.postApisV1ManagerSystemConfigBots({
    requestBody: data,
  });
  return response;
};

/**
 * updateBot 参数接口
 */
export interface UpdateBotParams {
  botId: string;
  data: BotUpdateRequest;
}

/**
 * 更新Bot
 */
export const updateBot = async ({
  botId,
  data,
}: UpdateBotParams) => {
  const response = await apiClient.bots.putApisV1ManagerSystemConfigBots({
    uid: botId,
    requestBody: data,
  });
  return response;
};

/**
 * 获取Bot加密信息参数接口
 */
export interface GetBotSecretParams {
  botId: string;
  fieldName: 'secret' | 'agent_cfg.api_key' | 'volc_cfg.ak' | 'volc_cfg.sk';
}

/**
 * 获取Bot加密信息
 */
export const getBotSecret = async ({
  botId,
  fieldName,
}: GetBotSecretParams): Promise<string> => {
  const response =
    await apiClient.bots.getApisV1ManagerSystemConfigBotsSecrets({
      uid: botId,
      fieldName,
    });

  if (response.code === API_RESPONSE_CODE.SUCCESS) {
    return response.data || '';
  }

  throw new Error(response.message || '获取加密信息失败');
};

// ==================== Bot 属性 API ====================

/**
 * 获取 Bot 属性列表的请求参数接口
 *
 * 对应 API: getApisV1ManagerSystemConfigBotAttributes
 * 基于 api-generate 中的参数定义
 */
export interface FetchAttributesParams {
  /** 跳过的记录数 */
  skip?: number;
  /** 返回的最大记录数 */
  limit?: number;
  /** 按属性名称筛选（多选） */
  names?: Array<AttributeKey> | string[];
  /** 按属性值筛选（模糊搜索） */
  value?: string;
}

/**
 * 获取特别关注列表 API
 */
export async function fetchAttributesApi(
  params: FetchAttributesParams,
): Promise<{
  data: BotAttribute[];
  total: number;
}> {
  const response =
    await apiClient.botAttributes.getApisV1ManagerSystemConfigBotAttributes(
      params,
    );

  if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
    return {
      data: response.data,
      total: response.data.length,
    };
  }

  return {
    data: [],
    total: 0,
  };
}

/**
 * 创建特别关注 API
 */
export async function createAttributeApi(
  payload: BotAttributePayload,
): Promise<boolean> {
  const response =
    await apiClient.botAttributes.postApisV1ManagerSystemConfigBotAttributes({
      requestBody: payload,
    });

  if (response.code === API_RESPONSE_CODE.SUCCESS) {
    return true;
  }

  throw new Error(response.message || '创建失败');
}

/**
 * 更新特别关注 API
 */
export async function updateAttributeApi(params: {
  botAttributeId: string;
  value: string;
}): Promise<boolean> {
  const response =
    await apiClient.botAttributes.putApisV1ManagerSystemConfigBotAttributes(
      params,
    );

  if (response.code === API_RESPONSE_CODE.SUCCESS) {
    return true;
  }

  throw new Error(response.message || '更新失败');
}

/**
 * 删除特别关注 API
 */
export async function deleteAttributeApi(params: {
  botAttributeId: string;
}): Promise<boolean> {
  const response =
    await apiClient.botAttributes.deleteApisV1ManagerSystemConfigBotAttributes1(
      params,
    );

  if (response.code === API_RESPONSE_CODE.SUCCESS) {
    return true;
  }

  throw new Error(response.message || '删除失败');
}
