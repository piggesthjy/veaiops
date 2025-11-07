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
import apiClient from '@/utils/api-client';
import { Drawer, Form } from '@arco-design/web-react';
import { useSubscribeRelationFormLogic } from '@ec/subscription';
import { SubscriptionOtherFields } from '@veaiops/components';
import { logger } from '@veaiops/utils';
import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
  SubscribeRelationWithAttributes,
} from 'api-generate';
import type React from 'react';
import { useEffect } from 'react';
import { UpdateTooltip } from '../update-tooltip';
import { BasicFields, InterestFields, WebhookFields } from './components';
import { useFormInitializer, useFormLogic } from './hooks';

/**
 * 订阅关系表单组件属性
 */
interface SubscribeRelationFormProps {
  /** 抽屉是否可见 */
  visible: boolean;
  /** 关闭抽屉的回调 */
  onClose: () => void;
  /** 提交表单的回调 */
  onSubmit: (
    data: SubscribeRelationCreate | SubscribeRelationUpdate,
  ) => Promise<boolean>;
  /** 编辑的订阅关系数据，为空时表示新建 */
  editData?: SubscribeRelationWithAttributes | null;
  /** 表单标题 */
  title?: string;
  /** 模块类型，用于决定显示哪些Agent选项 */
  moduleType?: ModuleType;
  /** 是否显示项目导入tooltip */
  showProjectTooltip?: boolean;
  /** 是否显示策略创建tooltip */
  showStrategyTooltip?: boolean;
  /** 隐藏项目tooltip的回调 */
  hideProjectTooltip?: () => void;
  /** 隐藏策略tooltip的回调 */
  hideStrategyTooltip?: () => void;
}

/**
 * 订阅关系表单抽屉组件
 * @description 用于新建和编辑订阅关系的抽屉表单
 */
const SubscribeRelationForm: React.FC<SubscribeRelationFormProps> = ({
  visible,
  onClose,
  onSubmit,
  editData,
  title,
  moduleType,
  showProjectTooltip = false,
  showStrategyTooltip = false,
  hideProjectTooltip,
  hideStrategyTooltip,
}) => {
  const [form] = Form.useForm();
  const { agentTypeOptions, eventLevelOptions } =
    useSubscribeRelationFormLogic(moduleType);

  // 表单逻辑
  const { loading, handleSubmit, handleCancel, resetForm } = useFormLogic({
    form,
    onSubmit,
    onClose,
    editData,
  });

  // 表单初始化
  const { initializeForm } = useFormInitializer({
    form,
    visible,
    editData,
  });

  // 当编辑数据变化时，填充表单
  useEffect(() => {
    initializeForm();

    // Debug log: snapshot input autocomplete attribute in development
    try {
      const el = document.querySelector('input[placeholder="请输入订阅名称"]');
      logger.debug({
        message: 'Input autocomplete snapshot',
        data: {
          autocomplete: el?.getAttribute('autocomplete') || null,
        },
        source: 'SubscribeRelationForm',
        component: 'useEffect',
      });
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.debug({
        message: 'Input autocomplete snapshot failed',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'SubscribeRelationForm',
        component: 'useEffect',
      });
    }
  }, [visible, editData, initializeForm]);

  return (
    <Drawer
      width={800}
      title={title || (editData ? '编辑订阅关系' : '新建订阅关系')}
      visible={visible}
      confirmLoading={loading}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="确定"
      cancelText="取消"
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <BasicFields form={form} agentTypeOptions={agentTypeOptions} />
        <InterestFields
          form={form}
          loading={loading}
          showProjectTooltip={showProjectTooltip}
          hideProjectTooltip={hideProjectTooltip}
        />
        <SubscriptionOtherFields
          eventLevelOptions={eventLevelOptions}
          showStrategyTooltip={showStrategyTooltip}
          hideStrategyTooltip={hideStrategyTooltip}
          eventLevelRequired={true}
          informStrategyRequired={false}
          informStrategyPlaceholder="请选择消息卡片通知策略（不选择表示不通知）"
          UpdateTooltipComponent={UpdateTooltip}
          apiClient={apiClient}
        />
        <WebhookFields form={form} />
      </Form>
    </Drawer>
  );
};

export default SubscribeRelationForm;
