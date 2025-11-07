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
import {
  type CreateAttributeParams,
  type LastRequestParams,
  createAttributeApi,
} from '@bot';
import { logger } from '@veaiops/utils';
import type { BotAttributePayload, ChannelType } from 'api-generate';
import { useCallback, useRef } from 'react';

/**
 * 使用 ref 来稳定参数引用
 */
interface UseCreateAttributeParams {
  botId: string;
  channel: ChannelType;
  lastRequestParamsRef: React.MutableRefObject<LastRequestParams>;
  setLoading: (loading: boolean) => void;
}

/**
 * 创建特别关注 Hook
 */
export function useCreateAttribute({
  botId,
  channel,
  lastRequestParamsRef,
  setLoading,
}: UseCreateAttributeParams) {
  // 使用ref来稳定botId和channel的引用，避免循环依赖
  const botIdRef = useRef(botId);
  const channelRef = useRef(channel);

  // 更新ref值，但不触发重新渲染
  botIdRef.current = botId;
  channelRef.current = channel;

  const createAttribute = useCallback(
    async (values: CreateAttributeParams) => {
      try {
        setLoading(true);
        const payload: BotAttributePayload = {
          channel: channelRef.current,
          bot_id: botIdRef.current,
          name: values.name,
          values: values.values,
        };

        const success = await createAttributeApi(payload);

        if (success) {
          Message.success('特别关注创建成功');
          // 记录：创建成功，由组件负责刷新表格
          logger.info({
            message: '特别关注创建成功',
            data: {
              savedNames: Array.isArray(lastRequestParamsRef.current.names)
                ? [...lastRequestParamsRef.current.names]
                : lastRequestParamsRef.current.names,
              savedValue: lastRequestParamsRef.current.value,
            },
            source: 'useBotAttributes',
            component: 'createAttribute',
          });
          // 不在这里刷新，由组件通过 CustomTable 的 refresh 方法刷新
          return true;
        }

        return false;
      } catch (error) {
        Message.error(
          error instanceof Error ? error.message : '创建特别关注失败，请重试',
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [lastRequestParamsRef, setLoading],
  );

  return createAttribute;
}
