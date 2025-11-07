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
import { CardWithTitle } from '@veaiops/components';
import type { ChannelType } from 'api-generate';
import type React from 'react';
import { LarkConfigGuide } from '../../lark-config-guide';
import { AppIdField, AppSecretField, ChannelField } from './basic-config/index';

interface BasicConfigProps {
  form: FormInstance;
  selectedChannel: ChannelType;
  currentBotId: string;
  showSecrets: {
    secret: boolean;
  };
  checkAppIdDuplicate: (appId: string) => Promise<string | undefined>;
  setSelectedChannel: (value: ChannelType) => void;
  toggleSecretVisibility: (field: 'secret') => void;
}

/**
 * 基础配置区块组件
 * @description 包含企业协同工具、App ID、App Secret 等基础配置字段
 *
 * 拆分说明：
 * - basic-config/channel-field.tsx: 企业协同工具选择字段
 * - basic-config/app-id-field.tsx: App ID 输入字段（包含重复检查）
 * - basic-config/app-secret-field.tsx: App Secret 输入字段（包含密码显示切换）
 * - basic-config.tsx: 主入口组件，负责组装和渲染
 */
export const BasicConfig: React.FC<BasicConfigProps> = ({
  form,
  selectedChannel,
  currentBotId,
  showSecrets,
  checkAppIdDuplicate,
  setSelectedChannel,
  toggleSecretVisibility,
}) => {
  return (
    <CardWithTitle title="基础配置" className="mb-4">
      <ChannelField
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
      />

      <AppIdField form={form} checkAppIdDuplicate={checkAppIdDuplicate} />

      <AppSecretField
        showSecrets={showSecrets}
        toggleSecretVisibility={toggleSecretVisibility}
      />

      {/* 飞书配置指引 */}
      <LarkConfigGuide currentBotId={currentBotId} />
    </CardWithTitle>
  );
};
