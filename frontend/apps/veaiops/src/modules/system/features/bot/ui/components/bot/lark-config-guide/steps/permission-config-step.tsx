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

import {
  Button,
  Input,
  Link,
  Space,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import { IconCopy } from '@arco-design/web-react/icon';
import type React from 'react';
import { PermissionsCollapse } from '../../permissions-collapse';

const { Text } = Typography;

interface PermissionConfigStepProps {
  currentBotId: string;
  authUrl: string;
  onCopy: (text: string) => Promise<boolean>;
}

/**
 * 权限配置步骤组件
 */
export const PermissionConfigStep: React.FC<PermissionConfigStepProps> = ({
  currentBotId,
  authUrl,
  onCopy,
}) => {
  return (
    <div>
      <Text type="secondary" className="block mb-1">
        3. 在「权限管理」页面，添加机器人所需的最小权限：
      </Text>
      {currentBotId ? (
        <div className="flex items-center gap-2 mb-2">
          <Input
            value={authUrl}
            readOnly
            size="small"
            suffix={
              <Space size="small">
                <Tooltip content="复制">
                  <Button
                    type="text"
                    size="small"
                    icon={<IconCopy style={{ fontSize: '12px' }} />}
                    onClick={() => onCopy(authUrl)}
                  />
                </Tooltip>
                <Link href={authUrl} target="_blank">
                  <Button type="text" size="small">
                    跳转
                  </Button>
                </Link>
              </Space>
            }
          />
        </div>
      ) : (
        <div className="bg-gray-50 p-3 rounded mb-2 border border-gray-200">
          <Text type="secondary" className="text-sm">
            💡 请先填写上方的 <Text type="warning">App ID</Text>{' '}
            后，将自动生成权限管理页面链接
          </Text>
        </div>
      )}
      <PermissionsCollapse />
    </div>
  );
};
