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

import { useBotAttributes } from '@bot/hooks';
import type { BotAttributeFiltersQuery, ModalType } from '@bot/types';
import { type BotAttribute, ChannelType } from 'api-generate';
import { useCallback, useRef, useState } from 'react';

/**
 * Bot属性表格状态管理Hook
 */
export const useAttributesTableLogicState = ({
  botId,
  channel,
}: {
  botId?: string;
  channel?: string | ChannelType;
}) => {
  // 状态管理
  const [editingAttribute, setEditingAttribute] = useState<BotAttribute | null>(
    null,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('create');

  // 转换 channel 为 ChannelType（如果 channel 是字符串类型）
  const channelType =
    (typeof channel === 'string' ? (channel as ChannelType) : channel) ||
    ChannelType.LARK;

  // 业务逻辑 Hook
  const {
    loading,
    fetchAttributes,
    createAttribute,
    updateAttribute,
    deleteAttribute,
  } = useBotAttributes({
    botId: botId || '',
    channel: channelType,
  });

  // 使用 ref 来稳定 fetchAttributes 函数的引用，避免死循环
  const fetchAttributesRef = useRef(fetchAttributes);
  fetchAttributesRef.current = fetchAttributes;

  // 创建一个稳定的请求函数
  const stableFetchAttributes = useCallback(
    (params?: BotAttributeFiltersQuery & { skip?: number; limit?: number }) => {
      return fetchAttributesRef.current(params);
    },
    [], // 空依赖数组，确保函数引用稳定
  );

  return {
    editingAttribute,
    setEditingAttribute,
    isModalVisible,
    setIsModalVisible,
    modalType,
    setModalType,
    loading,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    stableFetchAttributes,
  };
};
