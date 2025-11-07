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

import { Form, Message } from '@arco-design/web-react';
import {
  BOT_MESSAGES,
  type BotUpdateRequest,
  type ExtendedBot,
} from '@bot/lib';
import { logger } from '@veaiops/utils';
import { VolcCfgPayload } from 'api-generate';
import type React from 'react';
import { useEffect, useState } from 'react';
import { BaseConfig, ChatOpsConfig, FormActions } from './sections';

interface BotEditFormProps {
  bot: ExtendedBot;
  onSubmit: (values: BotUpdateRequest) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Bot编辑表单组件
 *
 * 拆分说明：
 * - sections/base-config.tsx: 基础配置区块（企业协同工具、App ID、App Secret）
 * - sections/chat-ops-config.tsx: ChatOps扩展配置区块（大模型配置、知识库配置）
 * - sections/form-actions.tsx: 操作按钮区块（取消、更新机器人）
 * - index.tsx: 主入口组件，负责组装和渲染
 *
 * 对应 origin/feat/web-v2 分支的实现，确保功能一致性
 */
export const BotEditForm: React.FC<BotEditFormProps> = ({
  bot,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();

  // 密码可见性状态管理
  const [showSecrets, setShowSecrets] = useState({
    secret: false,
    ak: false,
    sk: false,
    api_key: false,
  });

  // ChatOps高级配置开关（对应 origin/feat/web-v2：检查是否有 name 或 ak）
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(
    Boolean(bot?.agent_cfg?.name || bot?.volc_cfg?.ak),
  );

  // 知识库集合状态管理
  // 对应 origin/feat/web-v2：如果没有知识库集合，初始化为 ['']（一个空字符串的数组）
  const [kbCollections, setKbCollections] = useState<string[]>(() => {
    if (
      bot?.volc_cfg?.extra_kb_collections &&
      bot.volc_cfg.extra_kb_collections.length > 0
    ) {
      return bot.volc_cfg.extra_kb_collections;
    }
    return [''];
  });

  // 切换密码可见性
  const toggleSecretVisibility = (
    field: 'secret' | 'ak' | 'sk' | 'api_key',
  ) => {
    setShowSecrets((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // 知识库集合管理（对应 origin/feat/web-v2 分支的实现，同步更新表单值）
  const addKbCollection = () => {
    setKbCollections((prev) => [...prev, '']);
  };

  const removeKbCollection = (index: number) => {
    const newCollections = kbCollections.filter((_, i) => i !== index);
    setKbCollections(newCollections);
    // 同步更新表单值（对应 origin/feat/web-v2 分支的实现）
    const currentValues = form.getFieldsValue();
    form.setFieldsValue({
      ...currentValues,
      volc_cfg: {
        ...(currentValues.volc_cfg as BotUpdateRequest['volc_cfg']),
        extra_kb_collections: newCollections,
      },
    });
  };

  const updateKbCollection = (index: number, value: string) => {
    const newCollections = [...kbCollections];
    newCollections[index] = value;
    setKbCollections(newCollections);
    // 同步更新表单值（对应 origin/feat/web-v2 分支的实现）
    const currentValues = form.getFieldsValue();
    form.setFieldsValue({
      ...currentValues,
      volc_cfg: {
        ...(currentValues.volc_cfg as BotUpdateRequest['volc_cfg']),
        extra_kb_collections: newCollections,
      },
    });
  };

  useEffect(() => {
    if (bot) {
      // 从bot数据中提取知识库集合，如果没有则使用默认值（对应 origin/feat/web-v2）
      const initialKbCollections =
        bot.volc_cfg?.extra_kb_collections &&
        bot.volc_cfg.extra_kb_collections.length > 0
          ? bot.volc_cfg.extra_kb_collections
          : [''];

      setKbCollections(initialKbCollections);

      // 检查是否已有ChatOps配置（对应 origin/feat/web-v2：检查是否有 name 或 ak）
      const hasChatOpsConfig = Boolean(bot.agent_cfg?.name || bot.volc_cfg?.ak);
      setShowAdvancedConfig(hasChatOpsConfig);

      // 设置表单初始值（对应 origin/feat/web-v2 分支的实现）
      const formValues: Partial<BotUpdateRequest> & {
        channel?: string;
        bot_id?: string;
      } = {
        channel: bot.channel, // 用于显示和 Form.useWatch
        bot_id: bot.bot_id || '', // 用于显示和 Form.useWatch，空字符串默认值
        secret: '', // 明确赋空字符串，避免类型错误
        webhook_urls: bot.webhook_urls,
      };

      // 只有启用了ChatOps配置时，才设置这些字段（对应 origin/feat/web-v2）
      if (hasChatOpsConfig) {
        formValues.volc_cfg = {
          ak: '', // 明确赋空字符串（对应 origin/feat/web-v2）
          sk: '', // 明确赋空字符串（对应 origin/feat/web-v2）
          tos_region:
            (bot.volc_cfg?.tos_region as VolcCfgPayload.tos_region) ||
            VolcCfgPayload.tos_region.CN_BEIJING,
          network_type:
            (bot.volc_cfg?.network_type as VolcCfgPayload.network_type) ||
            VolcCfgPayload.network_type.INTERNAL,
          extra_kb_collections: initialKbCollections,
        };
        formValues.agent_cfg = {
          name: bot.agent_cfg?.name || '',
          embedding_name: bot.agent_cfg?.embedding_name || '',
          api_base:
            bot.agent_cfg?.api_base ||
            'https://ark.cn-beijing.volces.com/api/v3',
          api_key: '', // 明确赋空字符串（对应 origin/feat/web-v2）
        };
      }

      form.setFieldsValue(formValues);
    }
  }, [bot, form]);

  /**
   * 表单值类型定义
   * 为什么使用 Record<string, unknown>：
   * - Form.useForm() 返回的表单值类型是动态的，无法完全推断
   * - 表单字段包括：bot_id, secret, channel, webhook_urls, volc_cfg, agent_cfg
   * - 需要通过类型转换将表单值转换为 BotUpdateRequest
   */
  /**
   * 表单提交处理器
   * 对应 origin/feat/web-v2 分支的实现，确保功能一致性
   *
   * 处理逻辑：
   * 1. 过滤空的知识库集合
   * 2. 深度拦截空值：如果密钥字段为空值（空字符串或null），则设为 undefined，避免覆盖原值
   * 3. 只有当所有必填字段都存在时才提交 volc_cfg 或 agent_cfg
   */
  const handleSubmit = async (
    values: Record<string, unknown>,
  ): Promise<boolean> => {
    try {
      // 过滤空的知识库集合
      const filteredKbCollections = kbCollections.filter(
        (collection) => collection.trim() !== '',
      );

      // 深度拦截：如果密钥字段为空值（空字符串或null），则从提交数据中移除，避免覆盖原值
      // 后端逻辑：空值保留原配置，只有非空值才会更新
      // 重要：AgentCfgPayload 和 VolcCfgPayload 的所有必填字段必须提供，否则后端会报错
      // 解决方案：只有当所有必填字段都有值时，才提交 agent_cfg 或 volc_cfg
      const submitData: BotUpdateRequest = {
        ...values,
        // 处理 secret: 空字符串或 undefined 时不提交，保留原值
        secret:
          values.secret && String(values.secret).trim()
            ? (values.secret as string)
            : undefined,
      } as BotUpdateRequest;

      // 处理 volc_cfg：只有所有必填字段都存在时才提交
      // 必填字段：tos_region（ak 和 sk 是 Optional，可以为空）
      if ((values.volc_cfg as BotUpdateRequest['volc_cfg'])?.tos_region) {
        submitData.volc_cfg = {
          ...(values.volc_cfg as BotUpdateRequest['volc_cfg']),
          // ak 和 sk 为空字符串时设为 undefined，后端会保留原值
          ak:
            (values.volc_cfg as BotUpdateRequest['volc_cfg'])?.ak &&
            String((values.volc_cfg as BotUpdateRequest['volc_cfg']).ak).trim()
              ? (values.volc_cfg as BotUpdateRequest['volc_cfg']).ak
              : undefined,
          sk:
            (values.volc_cfg as BotUpdateRequest['volc_cfg'])?.sk &&
            String((values.volc_cfg as BotUpdateRequest['volc_cfg']).sk).trim()
              ? (values.volc_cfg as BotUpdateRequest['volc_cfg']).sk
              : undefined,
          extra_kb_collections: filteredKbCollections,
          // 确保必填字段存在
          tos_region: (values.volc_cfg as BotUpdateRequest['volc_cfg'])
            .tos_region,
          network_type:
            (values.volc_cfg as BotUpdateRequest['volc_cfg']).network_type ||
            VolcCfgPayload.network_type.INTERNAL,
        };
      } else {
        // 如果没有 volc_cfg 或缺少必填字段，不提交（后端会保留原值）
        submitData.volc_cfg = undefined;
      }

      // 处理 agent_cfg：只有所有必填字段都存在时才提交
      // 必填字段：name, embedding_name, api_base（api_key 在更新时是 Optional，可以为空）
      const agentCfg = values.agent_cfg as BotUpdateRequest['agent_cfg'];
      if (agentCfg?.name && agentCfg.embedding_name && agentCfg.api_base) {
        submitData.agent_cfg = {
          ...agentCfg,
          // api_key 为空字符串时设为 undefined，后端会保留原值
          api_key:
            agentCfg.api_key && String(agentCfg.api_key).trim()
              ? agentCfg.api_key
              : undefined,
          // 确保所有必填字段存在
          name: agentCfg.name,
          embedding_name: agentCfg.embedding_name,
          api_base: agentCfg.api_base,
        };
      } else {
        // 如果没有 agent_cfg 或缺少必填字段，不提交（后端会保留原值）
        submitData.agent_cfg = undefined;
      }

      // 如果 secret 为空，移除该字段（后端会保留原值）
      if (!submitData.secret) {
        delete submitData.secret;
      }

      const success = await onSubmit(submitData);
      if (success) {
        Message.success(BOT_MESSAGES.update.success);
        form.resetFields();
        onCancel?.();
      }
      // ✅ 修复：移除固定错误消息，避免与业务逻辑层的错误消息重复
      // 原因：useUpdateBot 的 catch 块已经显示了详细的错误消息
      return success;
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || BOT_MESSAGES.update.error;
      Message.error(errorMessage);
      logger.error({
        message: '机器人更新失败',
        data: {
          error: errorMessage,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'BotEditForm',
        component: 'handleSubmit',
      });
      return false;
    }
  };

  // URL 验证器（对应 origin/feat/web-v2 分支的实现）
  const urlValidator = (value: string, callback: (error?: string) => void) => {
    if (!value) {
      callback();
      return;
    }

    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(value)) {
      callback('请输入有效的URL地址（以http://或https://开头）');
      return;
    }
    callback();
  };

  return (
    <Form form={form} layout="vertical" onSubmit={handleSubmit}>
      <BaseConfig
        form={form}
        showSecrets={showSecrets}
        toggleSecretVisibility={toggleSecretVisibility}
        bot={bot}
      />
      <ChatOpsConfig
        form={form}
        bot={bot}
        showAdvancedConfig={showAdvancedConfig}
        setShowAdvancedConfig={setShowAdvancedConfig}
        kbCollections={kbCollections}
        showSecrets={showSecrets}
        toggleSecretVisibility={toggleSecretVisibility}
        addKbCollection={addKbCollection}
        removeKbCollection={removeKbCollection}
        updateKbCollection={updateKbCollection}
        urlValidator={urlValidator}
      />
      <FormActions onCancel={onCancel} loading={loading} />
    </Form>
  );
};

export default BotEditForm;
