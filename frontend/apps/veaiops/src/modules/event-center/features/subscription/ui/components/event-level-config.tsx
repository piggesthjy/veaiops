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

import { Card, Form, Select } from '@arco-design/web-react';
import { EVENT_LEVEL_OPTIONS } from '@ec/subscription';
import type React from 'react';

const FormItem = Form.Item;

/**
 * 事件级别配置组件属性接口
 */
// 注意：使用 object 类型替代 Record<string, never>，因为组件没有 props
// TODO: 如果后续添加 props，应定义具体的接口类型
type EventLevelConfigProps = object;

/**
 * 事件级别配置组件
 * 包含订阅的事件级别配置
 */
export const EventLevelConfig: React.FC<EventLevelConfigProps> = () => {
  return (
    <Card title="事件级别配置" className="mb-4">
      <FormItem
        label="订阅的事件级别"
        field="event_levels"
        rules={[{ required: true, message: '请选择事件级别' }]}
      >
        <Select
          mode="multiple"
          placeholder="请选择事件级别（可以订阅多个级别）"
          options={EVENT_LEVEL_OPTIONS}
        />
      </FormItem>
    </Card>
  );
};

export default EventLevelConfig;
