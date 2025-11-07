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

import { Alert } from '@arco-design/web-react';
import { BOT_ATTRIBUTES_INFO_MESSAGE } from '../lib';
import type { BotAttributesTableProps } from '../types';
import { AttributesTableContent } from './components';

/**
 * Bot属性表格组件
 * 提供Bot属性的CRUD功能
 *
 * 架构说明：
 * - AttributesTableContent 组件完全内聚了 CustomTable、useBotAttributesTable Hook 和所有相关 UI（包括模态框）
 * - 主组件只负责外层容器和提示信息，不管理任何业务逻辑和状态
 * - 符合 Feature-Based 架构的内聚原则：表格相关的所有内容都在 AttributesTableContent 中
 */
export const BotAttributesTable: React.FC<BotAttributesTableProps> = ({
  botId,
  channel,
}) => {
  return (
    <div className="bot-attributes-table">
      {/* 功能说明提示 */}
      <Alert
        type="info"
        content={BOT_ATTRIBUTES_INFO_MESSAGE}
        closable
        style={{ marginBottom: 16 }}
      />

      {/* 🎯 表格内容组件（完全自包含：CustomTable + useBotAttributesTable + 模态框） */}
      <AttributesTableContent botId={botId} channel={channel} />
    </div>
  );
};

export default BotAttributesTable;
