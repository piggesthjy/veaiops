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

import type { UseBotAttributesParams } from '@bot/types';
import { AttributeKey, type BotAttribute } from 'api-generate';
import { useRef, useState } from 'react';
import {
  useCreateAttribute,
  useDeleteAttribute,
  useFetchAttributes,
  useUpdateAttribute,
} from './helpers';

/**
 * Bot特别关注管理 Hook
 * 提供Bot特别关注的CRUD操作和状态管理
 */
export const useBotAttributes = ({
  botId,
  channel,
}: UseBotAttributesParams) => {
  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState<BotAttribute[]>([]);

  // 保存最近一次请求的筛选参数，用于新增/删除后刷新时保持筛选状态
  // 默认值为 [AttributeKey.PROJECT]，对应筛选器的默认值
  const lastRequestParamsRef = useRef<{
    names?: string[];
    value?: string;
  }>({
    names: [AttributeKey.PROJECT],
  });

  // 使用各个功能 Hook
  const fetchAttributes = useFetchAttributes({
    botId,
    channel,
    lastRequestParamsRef,
    setLoading,
    setAttributes,
  });

  const createAttribute = useCreateAttribute({
    botId,
    channel,
    lastRequestParamsRef,
    setLoading,
  });

  const updateAttribute = useUpdateAttribute({
    lastRequestParamsRef,
    setLoading,
  });

  const deleteAttribute = useDeleteAttribute({
    lastRequestParamsRef,
    setLoading,
  });

  return {
    loading,
    attributes,
    fetchAttributes,
    createAttribute,
    updateAttribute,
    deleteAttribute,
  };
};
