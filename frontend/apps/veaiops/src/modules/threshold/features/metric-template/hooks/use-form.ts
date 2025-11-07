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

import { Form } from '@arco-design/web-react';
import type { MetricTemplate } from 'api-generate';
import { useCallback, useState } from 'react';

/**
 * 指标模板表单处理 Hook
 * 提供表单状态管理和操作处理逻辑
 */
export const useMetricTemplateForm = () => {
  const [form] = Form.useForm();
  const [editingTemplate, setEditingTemplate] = useState<MetricTemplate | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * 处理编辑操作
   */
  const handleEdit = useCallback(
    async (template: MetricTemplate): Promise<boolean> => {
      setEditingTemplate(template);
      setModalVisible(true);
      // 填充表单数据
      form.setFieldsValue({ ...template });
      return true; // 编辑操作成功
    },
    [form],
  );

  /**
   * 处理新建操作
   */
  const handleAdd = useCallback(async (): Promise<boolean> => {
    setEditingTemplate(null);
    setModalVisible(true);
    form.resetFields();
    return true; // 新建操作成功
  }, [form]);

  /**
   * 处理模态框取消
   */
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingTemplate(null);
    form.resetFields();
  }, [form]);

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback(
    async (onSubmit: (values: any) => Promise<any>) => {
      try {
        const values = await form.validate();

        // 为未在表单中显示的字段添加默认值
        const completeValues = {
          ...values,
          min_step: values.min_step ?? 0.01,
          min_violation: values.min_violation ?? 0,
          min_violation_ratio: values.min_violation_ratio ?? 0.0,
          missing_value: values.missing_value ?? 'string',
          failure_interval_expectation:
            values.failure_interval_expectation ?? 1,
          display_unit: values.display_unit ?? '',
          linear_scale: values.linear_scale ?? 1.0,
          max_time_gap: values.max_time_gap ?? 3600,
          min_ts_length: values.min_ts_length ?? 600,
        };

        const result = await onSubmit(completeValues);

        // 根据结果判断是否成功
        if (result) {
          setModalVisible(false);
          setEditingTemplate(null);
          form.resetFields();
          return result;
        } else {
          // 操作失败，保持模态框打开
          return false;
        }
      } catch (error) {
        // 表单验证失败或API调用失败（错误已在 Hook 中处理）
        return false;
      }
    },
    [form],
  );

  return {
    // 状态
    form,
    editingTemplate,
    modalVisible,

    // 操作方法
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
  };
};
