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
import { useRequest } from 'ahooks';
import type { Chat } from 'api-generate';

/**
 * 下拉框选项的类型定义
 */
interface SelectOption {
  label: string;
  value: string;
}

/**
 * 将 Chat API 返回的数据项转换为适用于 Select 组件的格式
 * @param item - 单个 Chat 对象
 * @returns SelectOption 格式的对象
 */
const transformDataToOption = (item: Chat): SelectOption => ({
  label: item.name || item.chat_id,
  value: item.chat_id,
});

const useChatsList = () => {
  const {
    data,
    loading,
    error,
    run: fetchChats,
  } = useRequest(
    async (uid: string): Promise<SelectOption[]> => {
      const res = await apiClient.chats.getApisV1ConfigChats({
        uid,
        skip: 0,
        limit: 100, // 对于下拉列表，通常获取一个固定的较长列表是可接受的
      });
      if (res.code !== API_RESPONSE_CODE.SUCCESS) {
        throw new Error(res.message || '获取飞书群列表失败');
      }
      // 使用可选链和空值合并操作符确保安全，并进行数据转换
      return (res.data ?? []).map(transformDataToOption);
    },
    {
      manual: true,
      // 建议：可以根据业务需求开启缓存，避免重复请求
      // cacheKey: 'chats-list',
      // staleTime: 5 * 60 * 1000, // 5分钟内数据被认为是新鲜的
    },
  );

  // 返回更明确的接口，而不是 ahooks 的所有返回项
  return {
    chatOptions: data,
    loadingChats: loading,
    loadError: error,
    fetchChats,
  };
};

export default useChatsList;
