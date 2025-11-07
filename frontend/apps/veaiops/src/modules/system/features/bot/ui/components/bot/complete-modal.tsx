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
import type { BotCreateRequest, BotUpdateRequest } from '@bot/lib';
import { DrawerFormContent } from '@veaiops/utils';
import type { Bot } from 'api-generate';
import type React from 'react';
import { useBotCompleteSubmit } from './complete-modal/hooks';
import { BotCreateForm } from './create-form';
import { BotEditForm } from './edit-form';

interface BotCompleteModalProps {
  visible: boolean;
  editingBot: Bot | null;
  onCancel: () => void;
  onSubmit: (values: BotCreateRequest | BotUpdateRequest) => Promise<boolean>;
  loading?: boolean;
}

/**
 * 完整的Bot创建/编辑弹窗组件
 * @description 根据是否有editingBot来决定显示创建表单还是编辑表单
 */
export const BotCompleteModal: React.FC<BotCompleteModalProps> = ({
  visible,
  editingBot,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  // 使用 Hook 封装提交逻辑，统一处理创建和编辑表单
  const { handleCreateSubmit, handleEditSubmit } = useBotCompleteSubmit({
    onSubmit,
  });

  return (
    <Drawer
      title={editingBot ? '编辑机器人' : '新建机器人'}
      visible={visible}
      onCancel={loading ? undefined : onCancel}
      width={800}
      footer={null}
      closable={!loading}
    >
      <DrawerFormContent loading={Boolean(loading)}>
        {editingBot ? (
          <BotEditForm
            bot={editingBot}
            onSubmit={handleEditSubmit}
            onCancel={onCancel}
            loading={loading}
          />
        ) : (
          <BotCreateForm
            onSubmit={handleCreateSubmit}
            onCancel={onCancel}
            loading={loading}
          />
        )}
      </DrawerFormContent>
    </Drawer>
  );
};

export default BotCompleteModal;
