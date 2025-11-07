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

import { Alert, Form, Modal } from '@arco-design/web-react';
import type { BotAttributeFormData, ModalType } from '@bot/types';
import type { BotAttribute } from 'api-generate';
import type React from 'react';
import { useState } from 'react';
import { useAttributeFormModalEffects } from './effects';
import { useAttributeFormModalHandlers } from './handlers';
import { useAttributeValues } from './hooks';
import { FormFields } from './sections';

/**
 * Bot属性表单模态框组件属性接口
 */
interface BotAttributeFormModalProps {
  visible: boolean;
  type: ModalType;
  attribute?: BotAttribute;
  loading: boolean;
  onSubmit: (values: BotAttributeFormData) => Promise<boolean>;
  onCancel: () => void;
}

/**
 * Bot属性表单模态框组件
 * 提供创建和编辑Bot属性的表单界面
 *
 * 拆分说明：
 * - hooks/use-attribute-values.ts: 加载属性值的逻辑（根据类目加载对应的内容选项）
 * - effects.ts: 副作用管理（useEffect逻辑，编辑时更新表单值）
 * - handlers.ts: 事件处理（handleSubmit、handleCancel）
 * - sections/form-fields.tsx: 表单字段区块（类目和内容选择器）
 * - index.tsx: 主入口组件，负责表单渲染和提交
 */
export const BotAttributeFormModal: React.FC<BotAttributeFormModalProps> = ({
  visible,
  type,
  attribute,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm<BotAttributeFormData>();
  const [selectedAttributeName, setSelectedAttributeName] =
    useState<string>('');
  const { valueOptions, loadingValues, loadAttributeValues, setValueOptions } =
    useAttributeValues();

  // 副作用管理
  useAttributeFormModalEffects({
    form,
    type,
    attribute,
    setSelectedAttributeName,
    loadAttributeValues,
    setValueOptions,
  });

  // 事件处理
  const { handleSubmit, handleCancel } = useAttributeFormModalHandlers({
    form,
    onSubmit,
    onCancel,
    setValueOptions,
    setSelectedAttributeName,
  });

  /**
   * 处理类目变化
   *
   * 当用户选择或清除类目时：
   * 1. 更新 selectedAttributeName 状态（控制项目下拉框的启用/禁用）
   * 2. 清空当前选中的内容
   * 3. 如果选择了类目，加载对应的内容选项
   * 4. 如果清除了类目，清空内容选项
   */
  const handleAttributeNameChange = (value: string | undefined) => {
    const newValue = value || '';
    setSelectedAttributeName(newValue);
    // 清空内容 - 使用 undefined 而不是空字符串
    form.setFieldValue('value', undefined);

    if (newValue) {
      // 加载新的内容选项
      loadAttributeValues(newValue);
    } else {
      // 如果清除了类目，清空内容选项
      setValueOptions([]);
    }
  };

  return (
    <Modal
      title={type === 'create' ? '新增关注' : '编辑'}
      visible={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      maskClosable={false}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        {/* 功能说明 */}
        <Alert
          type="info"
          content="添加关注项目后，该机器人将能够接收和处理对应项目的事件推送，实现智能告警、问题识别等ChatOps功能。"
          style={{ marginBottom: 16 }}
        />

        <FormFields
          form={form}
          type={type === 'detail' ? 'edit' : type}
          selectedAttributeName={selectedAttributeName}
          valueOptions={valueOptions}
          loadingValues={loadingValues}
          onAttributeNameChange={handleAttributeNameChange}
        />
      </Form>
    </Modal>
  );
};

export default BotAttributeFormModal;
