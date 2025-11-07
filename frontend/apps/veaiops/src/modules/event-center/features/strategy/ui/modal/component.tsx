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

import { Button, Drawer, Form, Space } from '@arco-design/web-react';
import { DrawerFormContent, useDrawerFormSubmit } from '@veaiops/utils';
import type React from 'react';
import { useFormLogic } from './hooks';
import { FormFields, TopAlert } from './sections';
import type { StrategyModalProps } from './types';

/**
 * 策略弹窗组件
 * 提供策略的新增和编辑功能
 */
export const StrategyModal: React.FC<StrategyModalProps> = ({
  visible,
  editingStrategy,
  onCancel,
  onSubmit,
  form,
  width = 800,
}) => {
  // 表单逻辑
  const { botsOptions, chatOptions, selectedBotName } = useFormLogic(form);

  // 监听 bot_id 变化
  const bot_id = Form.useWatch('bot_id', form);

  // 使用公共的抽屉表单提交 Hook
  const { submitting, handleSubmit } = useDrawerFormSubmit({
    form,
    onSubmit: async (values) => {
      // 基本验证
      if (!values.name?.trim()) {
        throw new Error('请输入策略名称');
      }
      return await onSubmit(values);
    },
    resetOnSuccess: true,
    closeOnSuccess: false, // 不自动关闭，由父组件控制
  });

  return (
    <Drawer
      title={editingStrategy ? '编辑策略' : '新建策略'}
      visible={visible}
      onCancel={onCancel}
      width={width}
      maskClosable={false}
      // Prevent focus auto-jump causing container scroll reset
      autoFocus={false}
      focusLock={true}
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={submitting}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            保存
          </Button>
        </Space>
      }
    >
      <DrawerFormContent loading={submitting}>
        {/* 顶部提示信息 */}
        <TopAlert editingStrategy={editingStrategy} />

        {/* 表单字段（包含底部的注意事项） */}
        <Form form={form} layout="vertical" autoComplete="off">
          <FormFields
            form={form}
            botsOptions={botsOptions}
            chatOptions={chatOptions}
            bot_id={bot_id}
            selectedBotName={selectedBotName}
          />
        </Form>
      </DrawerFormContent>
    </Drawer>
  );
};

export default StrategyModal;
