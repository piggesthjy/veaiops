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

import type { ModuleType } from '@/types/module';
import { Button, Drawer, Form, Space } from '@arco-design/web-react';
// ✅ 优化：使用最短路径，合并同源导入
import { useDrawerManagement } from '@ec/shared';
import { useSubscriptionForm, useWebhookManagement } from '@ec/subscription';
import { DrawerFormContent } from '@veaiops/utils';
import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
  SubscribeRelationWithAttributes,
} from 'api-generate';
import type React from 'react';
import { useState } from 'react';
import {
  BasicInfoForm,
  EventLevelConfig,
  InterestConfig,
  NotificationConfig,
  WebhookConfig,
} from './components';

/**
 * 新增/编辑订阅弹窗组件属性接口
 */
interface SubscriptionModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (
    data: SubscribeRelationCreate | SubscribeRelationUpdate,
  ) => Promise<boolean>;
  initialData?: SubscribeRelationWithAttributes | null;
  title?: string;
  moduleType?: ModuleType;
}

/**
 * 新增/编辑订阅弹窗组件
 * 重构后的版本，使用拆分的子组件和自定义Hook
 */
export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  initialData,
  title = '新增订阅',
  moduleType,
}) => {
  // 控制是否启用滚动到错误位置
  const [enableScrollToError, setEnableScrollToError] = useState(false);

  // 使用表单管理Hook
  const { form, loading, handleSubmit } = useSubscriptionForm({
    visible,
    initialData,
    moduleType,
  });

  // 使用Webhook管理Hook
  // ✅ 修复：传递 initialData 以正确初始化编辑态的 webhook_headers
  const {
    webhookHeaders,
    addWebhookHeader,
    removeWebhookHeader,
    updateWebhookHeader,
    resetWebhookHeaders,
  } = useWebhookManagement({ initialData });

  // 使用抽屉管理Hook
  const {
    projectRefreshTrigger,
    strategyRefreshTrigger,
    openProjectImport,
    openStrategyCreate,
    renderProjectImportDrawer,
    renderStrategyCreateDrawer,
    showProjectTooltip,
    showStrategyTooltip,
    hideProjectTooltip,
    hideStrategyTooltip,
  } = useDrawerManagement();

  // 监听Webhook开关状态
  const enableWebhook = Form.useWatch('enable_webhook', form);

  // 处理表单提交
  const handleFormSubmit = async () => {
    // 提交时启用滚动到错误位置
    setEnableScrollToError(true);

    try {
      await handleSubmit(
        onSubmit,
        () => {
          resetWebhookHeaders();
          onCancel();
        },
        webhookHeaders,
        enableWebhook,
      );
    } finally {
      // 提交完成后禁用滚动到错误位置
      setEnableScrollToError(false);
    }
  };

  return (
    <Drawer
      title={title}
      visible={visible}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleFormSubmit}>
            确定
          </Button>
        </Space>
      }
      style={{ width: 800 }}
    >
      <DrawerFormContent loading={Boolean(loading)}>
        <Form
          form={form}
          layout="vertical"
          scrollToFirstError={enableScrollToError}
        >
          {/* 基本信息 */}
          <BasicInfoForm form={form} moduleType={moduleType} />

          {/* 关注属性配置 */}
          <InterestConfig
            projectRefreshTrigger={projectRefreshTrigger}
            onOpenProjectImport={openProjectImport}
            showProjectTooltip={showProjectTooltip}
            hideProjectTooltip={hideProjectTooltip}
          />

          {/* 事件级别配置 */}
          <EventLevelConfig />

          {/* 消息卡片通知策略配置 */}
          <NotificationConfig
            strategyRefreshTrigger={strategyRefreshTrigger}
            onOpenStrategyCreate={openStrategyCreate}
            showStrategyTooltip={showStrategyTooltip}
            hideStrategyTooltip={hideStrategyTooltip}
          />

          {/* Webhook配置 */}
          <WebhookConfig
            form={form}
            webhookHeaders={webhookHeaders}
            onAddWebhookHeader={addWebhookHeader}
            onRemoveWebhookHeader={removeWebhookHeader}
            onUpdateWebhookHeader={updateWebhookHeader}
          />
        </Form>
      </DrawerFormContent>

      {/* 渲染抽屉组件 */}
      {renderProjectImportDrawer()}
      {renderStrategyCreateDrawer()}
    </Drawer>
  );
};

export default SubscriptionModal;
