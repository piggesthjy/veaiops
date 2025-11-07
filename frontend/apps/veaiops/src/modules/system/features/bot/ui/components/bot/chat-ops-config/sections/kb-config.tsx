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

import { Collapse, Form } from '@arco-design/web-react';
import type React from 'react';
import {
  KbCollections,
  VolcCredentials,
  VolcSettings,
} from './kb-config/index';

const CollapseItem = Collapse.Item;

interface KbConfigProps {
  showAdvancedConfig: boolean;
  kbCollections: string[];
  showSecrets: {
    ak: boolean;
    sk: boolean;
  };
  toggleSecretVisibility: (field: 'ak' | 'sk') => void;
  addKbCollection: () => void;
  removeKbCollection: (index: number) => void;
  updateKbCollection: (params: { index: number; value: string }) => void;
}

/**
 * 知识库配置区块组件
 *
 * 拆分说明：
 * - kb-config/volc-credentials.tsx: 火山引擎凭证配置（Access Key、Secret Key）
 * - kb-config/volc-settings.tsx: 火山引擎设置配置（TOS区域、网络类型）
 * - kb-config/kb-collections.tsx: 知识库集合配置
 * - kb-config.tsx: 主入口组件，负责组装和渲染
 */
export const KbConfig: React.FC<KbConfigProps> = ({
  showAdvancedConfig,
  kbCollections,
  showSecrets,
  toggleSecretVisibility,
  addKbCollection,
  removeKbCollection,
  updateKbCollection,
}) => {
  return (
    <Collapse defaultActiveKey={['1']} className="mb-4">
      <CollapseItem header="知识库配置（仅支持火山引擎）" name="1">
        <VolcCredentials
          showAdvancedConfig={showAdvancedConfig}
          showSecrets={showSecrets}
          toggleSecretVisibility={toggleSecretVisibility}
        />

        <VolcSettings showAdvancedConfig={showAdvancedConfig} />

        <KbCollections
          kbCollections={kbCollections}
          addKbCollection={addKbCollection}
          removeKbCollection={removeKbCollection}
          updateKbCollection={updateKbCollection}
        />
      </CollapseItem>
    </Collapse>
  );
};
