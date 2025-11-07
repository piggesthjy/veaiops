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

import type { BotCreateRequest, BotUpdateRequest } from '@bot/lib';
import { useCallback } from 'react';

/**
 * 提交处理器参数接口
 */
export interface UseBotCompleteSubmitParams {
  /**
   * 提交处理器
   * 接受 BotCreateRequest 或 BotUpdateRequest，返回 Promise<boolean>
   */
  onSubmit: (values: BotCreateRequest | BotUpdateRequest) => Promise<boolean>;
}

export const useBotCompleteSubmit = ({
  onSubmit,
}: UseBotCompleteSubmitParams) => {
  /**
   * 创建表单提交处理器
   * 字段已对齐，直接透传即可
   */
  const handleCreateSubmit = useCallback(
    async (values: BotCreateRequest): Promise<boolean> => {
      return await onSubmit(values);
    },
    [onSubmit],
  );

  /**
   * 编辑表单提交处理器
   * 直接透传 BotUpdateRequest
   */
  const handleEditSubmit = useCallback(
    async (values: BotUpdateRequest): Promise<boolean> => {
      return await onSubmit(values);
    },
    [onSubmit],
  );

  return {
    handleCreateSubmit,
    handleEditSubmit,
  };
};
