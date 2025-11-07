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

import type { User } from '@account';
import { Form, Grid, Input } from '@arco-design/web-react';
import { formatDateTime } from '@veaiops/utils';
import type React from 'react';

const { Row, Col } = Grid;

/**
 * Account info display component Props
 */
interface AccountInfoProps {
  editingUser: User;
}

/**
 * Account info display component
 * Displays account creation time and last login time
 */
export const AccountInfo: React.FC<AccountInfoProps> = ({ editingUser }) => {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="创建时间">
          <Input
            value={
              editingUser.created_at
                ? formatDateTime(editingUser.created_at, true)
                : '未知'
            }
            disabled
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="最后登录">
          <Input
            value={
              editingUser.updated_at
                ? formatDateTime(editingUser.updated_at, true)
                : '从未登录'
            }
            disabled
          />
        </Form.Item>
      </Col>
    </Row>
  );
};
