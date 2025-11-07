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

import type { FetchAttributesParams, LastRequestParams } from '@bot';
import { useCallback } from 'react';
import { callFetchAttributesApi } from './api-call';
import { buildFetchAttributesParams } from './params-builder';
import { useFetchAttributesRefs } from './refs';

/**
 * 使用 ref 来稳定参数引用
 */
interface UseFetchAttributesParams {
  botId: string;
  channel: string;
  lastRequestParamsRef: React.MutableRefObject<LastRequestParams>;
  setLoading: (loading: boolean) => void;
  setAttributes: (attributes: unknown[]) => void;
}

/**
 * 获取特别关注列表 Hook
 *
 * 拆分说明：
 * - refs.ts: ref 管理（botIdRef、channelRef）
 * - params-builder.ts: 参数构建和日志记录
 * - api-call.ts: API调用和数据处理
 * - index.ts: 主入口，组合所有逻辑
 */
export function useFetchAttributes({
  botId,
  channel,
  lastRequestParamsRef,
  setLoading,
  setAttributes,
}: UseFetchAttributesParams) {
  // ref 管理
  const { botIdRef, channelRef } = useFetchAttributesRefs({ botId, channel });

  const fetchAttributes = useCallback(
    async (requestParams?: FetchAttributesParams) => {
      // 构建API请求参数
      const params = buildFetchAttributesParams({
        requestParams,
        lastRequestParamsRef,
      });

      // 调用API获取数据
      return await callFetchAttributesApi({
        params,
        botIdRef,
        channelRef,
        setLoading,
        setAttributes,
      });
    },
    [lastRequestParamsRef, setLoading, setAttributes, botIdRef, channelRef],
  );

  return fetchAttributes;
}
