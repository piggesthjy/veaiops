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
import { IconSwap } from '@arco-design/web-react/icon';
import type React from 'react';
import { LARK_REQUIRED_CALLBACKS } from './lark-config-guide-constants';

const CollapseItem = Collapse.Item;
const { Text } = Typography;

export const CallbacksCollapse: React.FC = () => {
  return (
    <Collapse
      className="mt-2"
      bordered={false}
      style={{ background: 'transparent' }}
    >
      <CollapseItem
        header={
          <span>
            <IconSwap style={{ marginRight: '8px', color: '#00b42a' }} />
            点击查看必须订阅的回调
          </span>
        }
        name="callbacks"
      >
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <Text type="secondary" className="block mb-2 text-sm font-medium">
            请在「回调配置」页面订阅以下回调：
          </Text>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {LARK_REQUIRED_CALLBACKS.map((callback) => (
              <li key={callback.name}>
                <Text type="secondary" className="text-xs">
                  <strong>{callback.name}</strong> ({callback.description})
                </Text>
              </li>
            ))}
          </ul>
          <Text type="secondary" className="block mt-2 text-xs">
            💡 此回调用于接收交互卡片的用户操作反馈
          </Text>
        </div>
      </CollapseItem>
    </Collapse>
  );
};

export default CallbacksCollapse;
