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
  Form,
  Input,
  Link,
  Message,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import type { FormInstance } from '@arco-design/web-react';
import {
  IconCheckCircle,
  IconEye,
  IconEyeInvisible,
} from '@arco-design/web-react/icon';
import { type ExtendedBot, getBotSecret } from '@bot/lib';
import { CardWithTitle } from '@veaiops/components';
import { AutofillBlockerPresets } from '@veaiops/utils';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { LarkConfigGuide } from '../../lark-config-guide';

const { Text } = Typography;

interface BaseConfigProps {
  form: FormInstance;
  showSecrets: {
    secret: boolean;
  };
  toggleSecretVisibility: (field: 'secret') => void;
  bot: ExtendedBot;
}

/**
 * 基础配置区块组件
 */
export const BaseConfig: React.FC<BaseConfigProps> = ({
  form,
  showSecrets,
  toggleSecretVisibility,
  bot,
}) => {
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [showSecretTooltip, setShowSecretTooltip] = useState(false);

  /**
   * 查看加密信息
   * 通过API获取解密后的secret值并填充到表单
   */
  const handleViewSecret = useCallback(async () => {
    if (!bot._id) {
      Message.error('Bot ID 不存在');
      return;
    }

    setLoadingSecret(true);
    try {
      const secretValue = await getBotSecret({
        botId: bot._id,
        fieldName: 'secret',
      });

      // 处理返回的数据：response.data 可能是字符串（包括空字符串）
      // 检查数据是否存在（不为 null 或 undefined）
      if (secretValue !== null && secretValue !== undefined) {
        const trimmedValue = String(secretValue).trim();
        // 只有非空字符串才回填
        if (trimmedValue) {
          // 使用 setFieldsValue 确保表单正确更新
          form.setFieldsValue({
            secret: trimmedValue,
          });
          // 使用 setTimeout 确保表单更新后再显示 Tooltip
          setTimeout(() => {
            setShowSecretTooltip(true);
          }, 100);
          Message.success('已获取加密信息');
        } else {
          // 返回空字符串表示该字段未配置
          Message.warning('该Bot的App Secret未配置');
        }
      } else {
        Message.warning('该Bot的App Secret未配置');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '获取加密信息失败';
      Message.error(errorMessage);
    } finally {
      setLoadingSecret(false);
    }
  }, [bot._id, form]);

  /**
   * 自动隐藏 Tooltip
   * 当成功回填 App Secret 后，显示 3 秒后自动隐藏
   */
  useEffect(() => {
    if (showSecretTooltip) {
      const timer = setTimeout(() => {
        setShowSecretTooltip(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showSecretTooltip]);

  return (
    <CardWithTitle title="基础配置" className="mb-4">
      {/* 只读显示：企业协同工具（不可编辑） */}
      <Form.Item label="企业协同工具" field="channel">
        <Input value={bot.channel} disabled />
      </Form.Item>

      {/* 只读显示：App ID（不可编辑） */}
      <Form.Item label="App ID" field="bot_id">
        <Input value={bot.bot_id} disabled />
      </Form.Item>

      <div style={{ position: 'relative' }}>
        <Form.Item
          label="App Secret"
          field="secret"
          rules={[
            {
              validator: (_value, cb) => {
                // 编辑态下允许留空，表示不修改密钥；若填写则按长度校验（最少1个字符避免意外空串）
                if (!_value) {
                  cb();
                  return;
                }
                if (String(_value).length >= 1) {
                  cb();
                } else {
                  cb('App Secret 不可为空');
                }
              },
            },
          ]}
          extra={
            <div>
              <Text type="secondary" className="block">
                请跳转{' '}
                <Link
                  href="https://open.larkoffice.com/app"
                  target="_blank"
                  style={{ fontSize: '12px' }}
                >
                  飞书开发者平台
                </Link>
                ，通过"创建自建应用"来新建机器人，或选择已有的机器人后跳转到详情页，在"凭证与基础信息"页面，复制粘贴相关内容
              </Text>
              <Button
                type="text"
                size="small"
                loading={loadingSecret}
                onClick={handleViewSecret}
                style={{ fontSize: '12px', padding: 0, marginTop: '4px' }}
              >
                查看加密信息
              </Button>
            </div>
          }
        >
          <Input
            type={showSecrets.secret ? 'text' : 'password'}
            placeholder="请输入机器人应用凭证：App Secret（留空表示不修改）"
            allowClear
            {...AutofillBlockerPresets.appSecret()}
            suffix={
              <Button
                type="text"
                size="small"
                icon={showSecrets.secret ? <IconEyeInvisible /> : <IconEye />}
                onClick={() => toggleSecretVisibility('secret')}
              />
            }
          />
        </Form.Item>
        {showSecretTooltip && (
          <Tooltip
            content={
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <IconCheckCircle
                  style={{ color: '#1CB267', fontSize: '14px' }}
                />
                <span>已回填 App Secret</span>
              </div>
            }
            position="top"
            popupVisible={showSecretTooltip}
            popupHoverStay={true}
            getPopupContainer={(node) => node.parentElement || document.body}
          >
            <div
              style={{
                position: 'absolute',
                top: '29px',
                left: '0',
                right: '0',
                height: '32px',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          </Tooltip>
        )}
      </div>

      {/* 飞书配置指引 - 使用当前 bot 的 ID */}
      {bot.bot_id && <LarkConfigGuide currentBotId={bot.bot_id} />}
    </CardWithTitle>
  );
};
