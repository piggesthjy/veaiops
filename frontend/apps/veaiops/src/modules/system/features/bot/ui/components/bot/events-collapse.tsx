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

import { Collapse, Typography } from '@arco-design/web-react';
import { IconNotification } from '@arco-design/web-react/icon';
import type React from 'react';
import { LARK_REQUIRED_EVENTS } from './lark-config-guide-constants';

const CollapseItem = Collapse.Item;
const { Text } = Typography;

export const EventsCollapse: React.FC = () => {
  return (
    <Collapse
      className="mt-2"
      bordered={false}
      style={{ background: 'transparent' }}
    >
      <CollapseItem
        header={
          <span>
            <IconNotification
              style={{ marginRight: '8px', color: '#3370ff' }}
            />
            点击查看必须订阅的事件
          </span>
        }
        name="events"
      >
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <Text type="secondary" className="block mb-2 text-sm font-medium">
            请在「事件配置」页面添加以下事件订阅：
          </Text>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {LARK_REQUIRED_EVENTS.map((event) => (
              <li key={event.name}>
                <Text type="secondary" className="text-xs">
                  <strong>{event.name}</strong> ({event.description})
                </Text>
              </li>
            ))}
          </ul>
          <Text type="secondary" className="block mt-2 text-xs">
            💡 这些事件订阅是 ChatOps 功能正常工作的必要条件
          </Text>
        </div>
      </CollapseItem>
    </Collapse>
  );
};

export default EventsCollapse;
