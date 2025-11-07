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

import { Button, Drawer, Form, Input, Space } from '@arco-design/web-react';
import { IconInfoCircle } from '@arco-design/web-react/icon';
import { DrawerFormContent, useDrawerFormSubmit } from '@veaiops/utils';
import type React from 'react';

interface ProjectCreateDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: { project_id: string; name: string }) => Promise<boolean>;
  loading?: boolean;
}

/**
 * 新建项目抽屉组件
 */
export const ProjectCreateDrawer: React.FC<ProjectCreateDrawerProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  // 使用公共的抽屉表单提交 Hook
  const { submitting, handleSubmit } = useDrawerFormSubmit({
    form,
    onSubmit,
    resetOnSuccess: true,
    closeOnSuccess: true,
    onClose,
  });

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      width={560}
      title="新建项目"
      visible={visible}
      onCancel={handleClose}
      focusLock={false}
      footer={
        <div className="text-right">
          <Space>
            <Button onClick={handleClose} disabled={submitting}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting || Boolean(loading)}
            >
              创建
            </Button>
          </Space>
        </div>
      }
      maskClosable={false}
    >
      <DrawerFormContent loading={submitting || Boolean(loading)}>
        <div className="p-6">
          <Form
            form={form}
            layout="vertical"
            scrollToFirstError
            autoComplete="off"
          >
            {/* 提示信息 */}
            <div className="px-4 py-3 rounded-lg border border-[#bedaff] mb-6 flex items-start gap-2 bg-[#f0f6ff]">
              <IconInfoCircle className="text-base text-[#165dff] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-[#4e5969] leading-relaxed">
                项目ID和项目名称是必填字段，创建后项目ID不可修改
              </div>
            </div>

            {/* 项目ID */}
            <Form.Item
              label="项目ID"
              field="project_id"
              rules={[
                {
                  required: true,
                  message: '请输入项目ID',
                },
                {
                  validator: (value, callback) => {
                    if (!value) {
                      callback();
                      return;
                    }
                    // 验证项目ID格式：只允许字母、数字、下划线和连字符
                    const regex = /^[a-zA-Z0-9_-]+$/;
                    if (!regex.test(value)) {
                      callback('项目ID只能包含字母、数字、下划线和连字符');
                    } else if (value.length < 2) {
                      callback('项目ID长度不能少于2个字符');
                    } else if (value.length > 64) {
                      callback('项目ID长度不能超过64个字符');
                    } else {
                      callback();
                    }
                  },
                },
              ]}
              extra="项目的唯一标识符，创建后不可修改"
            >
              <Input
                placeholder="请输入项目ID，如：proj_001"
                maxLength={64}
                showWordLimit
              />
            </Form.Item>

            {/* 项目名称 */}
            <Form.Item
              label="项目名称"
              field="name"
              rules={[
                {
                  required: true,
                  message: '请输入项目名称',
                },
                {
                  maxLength: 100,
                  message: '项目名称不能超过100个字符',
                },
                {
                  validator: (value, callback) => {
                    if (!value) {
                      callback();
                      return;
                    }
                    if (value.trim().length === 0) {
                      callback('项目名称不能为空白字符');
                    } else {
                      callback();
                    }
                  },
                },
              ]}
              extra="项目的显示名称，可以包含中文"
            >
              <Input
                placeholder="请输入项目名称，如：示例项目"
                maxLength={100}
                showWordLimit
              />
            </Form.Item>
          </Form>
        </div>
      </DrawerFormContent>
    </Drawer>
  );
};

export default ProjectCreateDrawer;
