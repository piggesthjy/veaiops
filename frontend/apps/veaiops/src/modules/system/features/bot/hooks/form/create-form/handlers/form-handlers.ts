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

import type { FormInstance } from '@arco-design/web-react';
import { Form, Message } from '@arco-design/web-react';
import { BOT_MESSAGES, type BotFormData } from '@bot/lib';

/**
 * 表单提交处理器参数
 */
interface FormHandlersParams {
  form: FormInstance;
  showAdvancedConfig: boolean;
  kbCollections: string[];
}

/**
 * 表单提交处理器Hook
 */
export const useFormHandlers = ({
  form,
  showAdvancedConfig,
  kbCollections,
}: FormHandlersParams) => {
  // 表单提交处理
  const createSubmitHandler = (
    onSubmit: (values: BotFormData) => Promise<boolean>,
  ) => {
    return async (values: BotFormData): Promise<boolean> => {
      try {
        let submitData: BotFormData;

        if (showAdvancedConfig) {
          // 过滤空的知识库集合
          const filteredKbCollections = kbCollections.filter(
            (collection) => collection.trim() !== '',
          );

          submitData = {
            ...values,
            volc_cfg: values.volc_cfg
              ? {
                  ...values.volc_cfg,
                  extra_kb_collections: filteredKbCollections,
                }
              : undefined,
            agent_cfg: values.agent_cfg,
          };
        } else {
          // 只提交基础配置
          submitData = {
            channel: values.channel,
            bot_id: values.bot_id,
            secret: values.secret,
          };
        }

        const success = await onSubmit(submitData);
        if (success) {
          Message.success(BOT_MESSAGES.create.success);
          form.resetFields();
          return true;
        } else {
          Message.error(BOT_MESSAGES.create.error);
          return false;
        }
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : BOT_MESSAGES.create.error;
        Message.error(errorMessage);
        return false;
      }
    };
  };

  return { createSubmitHandler };
};
