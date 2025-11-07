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

import { Message } from '@arco-design/web-react';
import { type FetchAttributesParams, fetchAttributesApi } from '@bot';
import type { BotAttribute } from 'api-generate';

/**
 * 调用API获取Bot属性列表
 */
export const callFetchAttributesApi = async ({
  params,
  botIdRef,
  channelRef,
  setLoading,
  setAttributes,
}: {
  params: FetchAttributesParams;
  botIdRef: React.MutableRefObject<string>;
  channelRef: React.MutableRefObject<string>;
  setLoading: (loading: boolean) => void;
  setAttributes: (attributes: BotAttribute[]) => void;
}) => {
  try {
    setLoading(true);

    const result = await fetchAttributesApi(params);

    if (result.data) {
      // 过滤当前bot的特别关注
      const filteredAttributes =
        result.data.filter(
          (attr: BotAttribute) =>
            attr.bot_id === botIdRef.current &&
            attr.channel === channelRef.current,
        ) || [];
      setAttributes(filteredAttributes);

      // 返回 CustomTable 期望的格式
      return {
        data: filteredAttributes,
        total: filteredAttributes.length,
      };
    }

    // 如果没有数据，返回空结果
    return {
      data: [],
      total: 0,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '获取特别关注列表失败，请重试';
    Message.error(errorMessage);

    // 错误时也要返回正确格式
    return {
      data: [],
      total: 0,
    };
  } finally {
    setLoading(false);
  }
};
