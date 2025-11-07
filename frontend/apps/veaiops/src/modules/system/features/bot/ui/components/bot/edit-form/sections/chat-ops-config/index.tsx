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

import {
  Form,
  type FormInstance,
  Space,
  Switch,
  Typography,
} from '@arco-design/web-react';
import type { ExtendedBot } from '@bot/lib';
import { CardWithTitle } from '@veaiops/components';
import type React from 'react';
import { KnowledgeBaseConfig, ModelConfig } from './components';
import { type UrlValidator, useSecretViewer, useUrlValidator } from './hooks';

const { Text } = Typography;

/**
 * ChatOps配置组件的 Props
 */
interface ChatOpsConfigProps {
  form: FormInstance;
  bot?: ExtendedBot;
  showAdvancedConfig: boolean;
  setShowAdvancedConfig: (show: boolean) => void;
  kbCollections: string[];
  showSecrets: {
    ak: boolean;
    sk: boolean;
    api_key: boolean;
  };
  toggleSecretVisibility: (field: 'ak' | 'sk' | 'api_key') => void;
  addKbCollection: () => void;
  removeKbCollection: (index: number) => void;
  updateKbCollection: (index: number, value: string) => void;
  urlValidator?: UrlValidator;
}

/**
 * ChatOps扩展配置组件（编辑表单专用）
 *
 * 对应 origin/feat/web-v2 分支的实现，确保功能一致性
 *
 * 拆分说明：
 * - 大模型配置（ModelConfig）：模型名称、Embedding模型名称、API Base URL、API Key
 * - 知识库配置（KnowledgeBaseConfig）：Access Key、Secret Key、TOS区域、网络类型、知识库集合
 * - 共享逻辑（hooks）：加密信息查看、URL验证
 */
export const ChatOpsConfig: React.FC<ChatOpsConfigProps> = ({
  form,
  bot,
  showAdvancedConfig,
  setShowAdvancedConfig,
  kbCollections,
  showSecrets,
  toggleSecretVisibility,
  addKbCollection,
  removeKbCollection,
  updateKbCollection,
  urlValidator,
}) => {
  // 使用共享的 Hooks
  const secretViewer = useSecretViewer({
    botId: bot?._id,
    form,
  });

  const finalUrlValidator = useUrlValidator(urlValidator);

  return (
    <CardWithTitle title="ChatOps扩展配置" className="mb-4">
      <div className="mb-4">
        <Space align="center">
          <Switch
            checked={showAdvancedConfig}
            onChange={setShowAdvancedConfig}
          />
          <Text className="font-medium">配置ChatOps高级功能</Text>
        </Space>
        <Text type="secondary" className="block mt-2">
          ChatOps功能包括智能问答、内容识别等AI能力。如不配置，将使用系统默认配置，不影响智能阈值服务（包括告警消息推送）。
        </Text>
      </div>

      {showAdvancedConfig && (
        <>
          <ModelConfig
            form={form}
            showAdvancedConfig={showAdvancedConfig}
            showSecrets={showSecrets}
            toggleSecretVisibility={toggleSecretVisibility}
            secretViewer={secretViewer}
            urlValidator={finalUrlValidator}
            botId={bot?._id}
          />

          <KnowledgeBaseConfig
            form={form}
            showAdvancedConfig={showAdvancedConfig}
            showSecrets={showSecrets}
            toggleSecretVisibility={toggleSecretVisibility}
            secretViewer={secretViewer}
            kbCollections={kbCollections}
            addKbCollection={addKbCollection}
            removeKbCollection={removeKbCollection}
            updateKbCollection={updateKbCollection}
            botId={bot?._id}
          />
        </>
      )}
    </CardWithTitle>
  );
};
