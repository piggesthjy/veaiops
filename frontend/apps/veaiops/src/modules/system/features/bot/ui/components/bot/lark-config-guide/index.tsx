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

import { Link, Message, Typography } from '@arco-design/web-react';
import { safeCopyToClipboard } from '@veaiops/utils';
import type React from 'react';
import {
  getCallbackUrl,
  getHookUrl,
  getLarkAuthUrl,
  getLarkEventUrl,
} from '../lark-config-guide-constants';
import {
  CallbackConfigStep,
  EventConfigStep,
  PermissionConfigStep,
} from './steps';

const { Text } = Typography;

interface LarkConfigGuideProps {
  currentBotId: string;
}

/**
 * 飞书配置指引组件
 *
 * 拆分说明：
 * - steps/event-config-step.tsx: 事件配置步骤（步骤1）
 * - steps/callback-config-step.tsx: 回调配置步骤（步骤2）
 * - steps/permission-config-step.tsx: 权限配置步骤（步骤3）
 * - index.tsx: 主入口组件，负责组装和渲染
 */
export const LarkConfigGuide: React.FC<LarkConfigGuideProps> = ({
  currentBotId,
}) => {
  const currentDomain = window.location.origin;
  const hookUrl = getHookUrl(currentDomain);
  const callbackUrl = getCallbackUrl(currentDomain);
  const eventUrl = getLarkEventUrl(currentBotId);
  const authUrl = getLarkAuthUrl(currentBotId);

  const handleCopyText = async (text: string): Promise<boolean> => {
    try {
      const copyResult = await safeCopyToClipboard(text);
      if (copyResult.success) {
        Message.success('已复制到剪贴板');
        return true;
      } else if (copyResult.error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          copyResult.error instanceof Error
            ? copyResult.error.message
            : '复制失败，请重试';
        Message.error(errorMessage);
        return false;
      }
      return false;
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息（兼容旧版本可能抛出错误的情况）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || '复制失败，请重试';
      Message.error(errorMessage);
      return false;
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded mt-4">
      <Text className="block mb-2 font-medium">
        📝 机器人配置指引（请在飞书开发者平台完成以下配置）
      </Text>
      <Text type="secondary" className="block mb-3">
        请跳转{' '}
        <Link href={eventUrl} target="_blank" style={{ fontSize: '12px' }}>
          飞书开发者平台
        </Link>
        ，选择对应的应用，进入「事件与回调」页面，完成以下配置：
      </Text>

      <div className="space-y-3">
        <EventConfigStep hookUrl={hookUrl} onCopy={handleCopyText} />
        <CallbackConfigStep callbackUrl={callbackUrl} onCopy={handleCopyText} />
        <PermissionConfigStep
          currentBotId={currentBotId}
          authUrl={authUrl}
          onCopy={handleCopyText}
        />
      </div>
    </div>
  );
};

export default LarkConfigGuide;
