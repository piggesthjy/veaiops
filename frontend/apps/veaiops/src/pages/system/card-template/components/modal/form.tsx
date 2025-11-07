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

import { channelTypeOptions } from '@/modules/event-center/features/strategy/constants/options';
import { AGENT_TYPE_OPTIONS } from '@/pages/event-center/card-template/types';
import { Form, type FormInstance, Input, Select } from '@arco-design/web-react';

const CardTemplateForm = ({ form }: { form: FormInstance }) => {
  return (
    <Form form={form} layout="vertical" autoComplete="off">
      <Form.Item
        label="模版ID"
        field="template_id"
        rules={[{ required: true, message: '请输入模版ID' }]}
      >
        <Input placeholder="请输入模版ID" />
      </Form.Item>
      <Form.Item
        label="智能体"
        field="agents"
        rules={[{ required: true, message: '请选择智能体' }]}
      >
        <Select
          mode="multiple"
          placeholder="请选择智能体"
          options={AGENT_TYPE_OPTIONS}
        />
      </Form.Item>
      <Form.Item
        label="企业协同工具"
        field="channel"
        rules={[{ required: true, message: '请选择企业协同工具' }]}
      >
        <Select placeholder="请选择企业协同工具" options={channelTypeOptions} />
      </Form.Item>
    </Form>
  );
};
export default CardTemplateForm;
