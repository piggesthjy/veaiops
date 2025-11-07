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

import { Modal } from '@arco-design/web-react';
import { CellRender } from '@veaiops/components';
import type { BotAttribute } from 'api-generate';
import type React from 'react';

const { StampTime } = CellRender;

interface AttributeDetailModalProps {
  visible: boolean;
  attribute?: BotAttribute;
  onCancel: () => void;
}

/**
 * Attribute detail view modal
 */
export const AttributeDetailModal: React.FC<AttributeDetailModalProps> = ({
  visible,
  attribute,
  onCancel,
}) => {
  return (
    <Modal
      title="属性详情"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      style={{ width: 600 }}
    >
      {attribute && (
        <div className="attribute-detail">
          <div className="detail-item">
            <span className="label">属性名称：</span>
            <span className="value">{attribute.name}</span>
          </div>
          <div className="detail-item">
            <span className="label">属性值：</span>
            <span className="value">{attribute.value}</span>
          </div>
          <div className="detail-item">
            <span className="label">Bot ID：</span>
            <span className="value">{attribute.bot_id}</span>
          </div>
          <div className="detail-item">
            <span className="label">渠道类型：</span>
            <span className="value">{attribute.channel}</span>
          </div>
          <div className="detail-item">
            <span className="label">创建时间：</span>
            <span className="value">
              <StampTime time={attribute.created_at} />
            </span>
          </div>
          <div className="detail-item">
            <span className="label">更新时间：</span>
            <span className="value">
              <StampTime time={attribute.updated_at} />
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};
