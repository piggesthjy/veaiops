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

import { Drawer } from '@arco-design/web-react';
import { type Bot, ChannelType } from 'api-generate';
import type React from 'react';
import { BotAttributesTable } from '../../attributes-table';
import { BotDrawerTitle } from './drawer-title';

interface BotAttributesDrawerProps {
  visible: boolean;
  onClose: () => void;
  bot: Bot | null;
}

/**
 * Bot特别关注抽屉组件
 * 显示Bot的特别关注信息（对应v2分支的实现）
 *
 * 重构说明（对齐 origin/feat/web-v2 分支）：
 * - 使用 BotDrawerTitle 组件显示标题和Bot信息（App ID、名称）
 * - 抽屉宽度设置为 1000（v2分支为1000，当前分支原为800）
 * - 移除 footer（footer={null}）
 * - 添加 focusLock={false}
 * - 移除 onOk 属性（v2分支使用 footer={null}，不需要onOk）
 * - 使用 ui/bot-attributes-table 作为表格组件（与v2分支路径一致）
 *
 * 命名说明：
 * - 技术实现层面：使用"Bot属性"（BotAttribute）作为数据模型名称
 * - 用户界面层面：使用"特别关注"（Special Attention）作为显示名称
 * - 与origin/feat/web-v2分支保持一致的用户体验
 */
export const BotAttributesDrawer: React.FC<BotAttributesDrawerProps> = ({
  visible,
  onClose,
  bot,
}) => {
  if (!bot) {
    return null;
  }

  // 从Bot对象中获取渠道类型
  // Bot.channel 和 ChannelType 枚举值相同，通过字符串值进行转换
  const channelType =
    (bot.channel as string as ChannelType) || ChannelType.LARK;

  return (
    <Drawer
      width={1000}
      title={<BotDrawerTitle bot={bot} title="特别关注" />}
      visible={visible}
      onCancel={onClose}
      footer={null}
      focusLock={false}
    >
      <BotAttributesTable botId={bot.bot_id || ''} channel={channelType} />
    </Drawer>
  );
};
