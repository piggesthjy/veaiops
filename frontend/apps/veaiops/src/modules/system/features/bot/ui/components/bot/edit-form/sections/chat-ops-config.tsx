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

import apiClient from '@/utils/api-client';
import {
  Button,
  Collapse,
  Form,
  type FormInstance,
  Input,
  Message,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import {
  IconCheckCircle,
  IconDelete,
  IconEye,
  IconEyeInvisible,
  IconPlus,
} from '@arco-design/web-react/icon';
import {
  type ExtendedBot,
  NETWORK_TYPE_OPTIONS,
  TOS_REGION_OPTIONS,
} from '@bot/lib';
import { CardWithTitle } from '@veaiops/components';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { AutofillBlockerPresets } from '@veaiops/utils';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

const { Text } = Typography;
const CollapseItem = Collapse.Item;

interface ChatOpsConfigProps {
  form: FormInstance;
  bot?: ExtendedBot;
  showAdvancedConfig: boolean;
  setShowAdvancedConfig: (show: boolean) => void;
  kbCollections: string[];
  showSecrets: {
    ak: boolean;
    sk: boolean;
    api_key: boolean;
  };
  toggleSecretVisibility: (field: 'ak' | 'sk' | 'api_key') => void;
  addKbCollection: () => void;
  removeKbCollection: (index: number) => void;
  updateKbCollection: (index: number, value: string) => void;
  urlValidator?: (value: string, callback: (error?: string) => void) => void;
}

/**
 * ChatOps扩展配置组件（编辑表单专用）
 *
 * 对应 origin/feat/web-v2 分支的实现，确保功能一致性
 *
 * 拆分说明：
 * - 大模型配置（Collapse）：模型名称、Embedding模型名称、API Base URL、API Key
 * - 知识库配置（Collapse）：Access Key、Secret Key、TOS区域、网络类型、知识库集合
 */
export const ChatOpsConfig: React.FC<ChatOpsConfigProps> = ({
  form,
  bot,
  showAdvancedConfig,
  setShowAdvancedConfig,
  kbCollections,
  showSecrets,
  toggleSecretVisibility,
  addKbCollection,
  removeKbCollection,
  updateKbCollection,
  urlValidator,
}) => {
  const [loadingSecrets, setLoadingSecrets] = useState({
    api_key: false,
    ak: false,
    sk: false,
  });
  const [showSecretTooltips, setShowSecretTooltips] = useState({
    api_key: false,
    ak: false,
    sk: false,
  });

  /**
   * 查看加密信息
   * 通过API获取解密后的值并填充到表单
   */
  const handleViewSecret = useCallback(
    async (
      fieldName: 'agent_cfg.api_key' | 'volc_cfg.ak' | 'volc_cfg.sk',
      formField: string,
      secretKey: 'api_key' | 'ak' | 'sk',
    ) => {
      if (!bot?._id) {
        Message.error('Bot ID 不存在');
        return;
      }

      setLoadingSecrets((prev) => ({ ...prev, [secretKey]: true }));
      try {
        const response =
          await apiClient.bots.getApisV1ManagerSystemConfigBotsSecrets({
            uid: bot._id,
            fieldName,
          });

        if (response.code === API_RESPONSE_CODE.SUCCESS) {
          if (response.data) {
            form.setFieldValue(formField, response.data);
            setShowSecretTooltips((prev) => ({ ...prev, [secretKey]: true }));
            Message.success('已获取加密信息');
          } else {
            Message.warning('该字段未配置');
          }
        } else {
          Message.error(response.message || '获取加密信息失败');
        }
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '获取加密信息失败';
        Message.error(errorMessage);
      } finally {
        setLoadingSecrets((prev) => ({ ...prev, [secretKey]: false }));
      }
    },
    [bot?._id, form],
  );

  // 自动隐藏 tooltip
  useEffect(() => {
    const timers = Object.entries(showSecretTooltips).map(([key, show]) => {
      if (show) {
        return setTimeout(() => {
          setShowSecretTooltips((prev) => ({ ...prev, [key]: false }));
        }, 3000);
      }
      return null;
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) {
          clearTimeout(timer);
        }
      });
    };
  }, [showSecretTooltips]);

  // URL 验证器（如果未提供，使用默认验证，对应 origin/feat/web-v2 分支的实现）
  const defaultUrlValidator = useCallback(
    (value: string | undefined, callback: (error?: string) => void) => {
      if (!value) {
        callback();
        return;
      }

      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(value)) {
        callback('请输入有效的URL地址（以http://或https://开头）');
        return;
      }
      callback();
    },
    [],
  );

  const finalUrlValidator = urlValidator || defaultUrlValidator;

  return (
    <CardWithTitle title="ChatOps扩展配置" className="mb-4">
      <div className="mb-4">
        <Space align="center">
          <Switch
            checked={showAdvancedConfig}
            onChange={setShowAdvancedConfig}
          />
          <Text className="font-medium">配置ChatOps高级功能</Text>
        </Space>
        <Text type="secondary" className="block mt-2">
          ChatOps功能包括智能问答、内容识别等AI能力。如不配置，将使用系统默认配置，不影响智能阈值服务（包括告警消息推送）。
        </Text>
      </div>

      {showAdvancedConfig && (
        <>
          {/* 大模型配置 */}
          <Collapse defaultActiveKey={['1']} className="mb-4">
            <CollapseItem header="大模型配置" name="1">
              <Form.Item
                label="模型名称"
                field="agent_cfg.name"
                rules={[
                  {
                    required: showAdvancedConfig,
                    message: '请输入模型名称',
                  },
                ]}
              >
                <Input
                  placeholder="使用火山引擎方舟平台，请输入ep-开头的模型名称"
                  allowClear
                />
              </Form.Item>

              <Form.Item
                label="Embedding模型名称"
                field="agent_cfg.embedding_name"
                rules={[
                  {
                    required: showAdvancedConfig,
                    message: '请输入Embedding模型名称',
                  },
                ]}
              >
                <Input
                  placeholder="使用火山引擎方舟平台，请输入ep-开头的模型名称"
                  allowClear
                />
              </Form.Item>

              <Form.Item
                label="API Base URL"
                field="agent_cfg.api_base"
                rules={[
                  {
                    required: showAdvancedConfig,
                    message: '请输入API Base URL',
                  },
                  {
                    validator: (
                      value: string | undefined,
                      callback: (error?: string) => void,
                    ) => {
                      finalUrlValidator(value, callback);
                    },
                  },
                ]}
              >
                <Input placeholder="请输入API Base URL" allowClear />
              </Form.Item>

              <div className="relative">
                <Form.Item
                  label="API Key"
                  field="agent_cfg.api_key"
                  rules={[
                    {
                      required: showAdvancedConfig,
                      message: '请输入API Key',
                    },
                  ]}
                  extra={
                    bot && (
                      <div>
                        <Button
                          type="text"
                          size="small"
                          loading={loadingSecrets.api_key}
                          onClick={() =>
                            handleViewSecret(
                              'agent_cfg.api_key',
                              'agent_cfg.api_key',
                              'api_key',
                            )
                          }
                          style={{ fontSize: '12px', padding: 0 }}
                        >
                          查看加密信息
                        </Button>
                      </div>
                    )
                  }
                >
                  <Input
                    type={showSecrets.api_key ? 'text' : 'password'}
                    placeholder="请输入API Key（留空表示不修改）"
                    allowClear
                    {...AutofillBlockerPresets.apiKey()}
                    suffix={
                      <Button
                        type="text"
                        size="small"
                        icon={
                          showSecrets.api_key ? (
                            <IconEyeInvisible />
                          ) : (
                            <IconEye />
                          )
                        }
                        onClick={() => toggleSecretVisibility('api_key')}
                      />
                    }
                  />
                </Form.Item>
                {showSecretTooltips.api_key && (
                  <Tooltip
                    content={
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconCheckCircle
                          style={{ color: '#1CB267', fontSize: '14px' }}
                        />
                        <span>已回填 API Key</span>
                      </div>
                    }
                    position="top"
                    popupVisible={showSecretTooltips.api_key}
                    popupHoverStay={true}
                    getPopupContainer={(node) =>
                      node.parentElement || document.body
                    }
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
            </CollapseItem>
          </Collapse>

          {/* 知识库配置 */}
          <Collapse defaultActiveKey={['1']} className="mb-4">
            <CollapseItem header="知识库配置（仅支持火山引擎）" name="1">
              <div className="relative">
                <Form.Item
                  label="Access Key"
                  field="volc_cfg.ak"
                  rules={[
                    {
                      required: showAdvancedConfig,
                      message: '请输入Access Key',
                    },
                  ]}
                  extra={
                    bot && (
                      <Button
                        type="text"
                        size="small"
                        loading={loadingSecrets.ak}
                        onClick={() =>
                          handleViewSecret('volc_cfg.ak', 'volc_cfg.ak', 'ak')
                        }
                        style={{ fontSize: '12px', padding: 0 }}
                      >
                        查看加密信息
                      </Button>
                    )
                  }
                >
                  <Input
                    type={showSecrets.ak ? 'text' : 'password'}
                    placeholder="请输入火山引擎Access Key（留空表示不修改）"
                    allowClear
                    {...AutofillBlockerPresets.accessKey()}
                    suffix={
                      <Button
                        type="text"
                        size="small"
                        icon={
                          showSecrets.ak ? <IconEyeInvisible /> : <IconEye />
                        }
                        onClick={() => toggleSecretVisibility('ak')}
                      />
                    }
                  />
                </Form.Item>
                {showSecretTooltips.ak && (
                  <Tooltip
                    content={
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconCheckCircle
                          style={{ color: '#1CB267', fontSize: '14px' }}
                        />
                        <span>已回填 Access Key</span>
                      </div>
                    }
                    position="top"
                    popupVisible={showSecretTooltips.ak}
                    popupHoverStay={true}
                    getPopupContainer={(node) =>
                      node.parentElement || document.body
                    }
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

              <div className="relative">
                <Form.Item
                  label="Secret Key"
                  field="volc_cfg.sk"
                  rules={[
                    {
                      required: showAdvancedConfig,
                      message: '请输入Secret Key',
                    },
                  ]}
                  extra={
                    bot && (
                      <Button
                        type="text"
                        size="small"
                        loading={loadingSecrets.sk}
                        onClick={() =>
                          handleViewSecret('volc_cfg.sk', 'volc_cfg.sk', 'sk')
                        }
                        style={{ fontSize: '12px', padding: 0 }}
                      >
                        查看加密信息
                      </Button>
                    )
                  }
                >
                  <Input
                    type={showSecrets.sk ? 'text' : 'password'}
                    placeholder="请输入火山引擎Secret Key（留空表示不修改）"
                    allowClear
                    {...AutofillBlockerPresets.secretKey()}
                    suffix={
                      <Button
                        type="text"
                        size="small"
                        icon={
                          showSecrets.sk ? <IconEyeInvisible /> : <IconEye />
                        }
                        onClick={() => toggleSecretVisibility('sk')}
                      />
                    }
                  />
                </Form.Item>
                {showSecretTooltips.sk && (
                  <Tooltip
                    content={
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconCheckCircle
                          style={{ color: '#1CB267', fontSize: '14px' }}
                        />
                        <span>已回填 Secret Key</span>
                      </div>
                    }
                    position="top"
                    popupVisible={showSecretTooltips.sk}
                    popupHoverStay={true}
                    getPopupContainer={(node) =>
                      node.parentElement || document.body
                    }
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

              <Form.Item
                label="TOS区域"
                field="volc_cfg.tos_region"
                rules={[
                  {
                    required: showAdvancedConfig,
                    message: '请选择TOS区域',
                  },
                ]}
              >
                <Select placeholder="请选择TOS区域">
                  {TOS_REGION_OPTIONS.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="网络类型"
                field="volc_cfg.network_type"
                rules={[
                  {
                    required: showAdvancedConfig,
                    message: '请选择网络类型',
                  },
                ]}
              >
                <Select placeholder="请选择网络类型">
                  {NETWORK_TYPE_OPTIONS.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* 知识库集合配置 */}
              <div className="mb-4">
                <Text className="block mb-2">火山引擎方舟知识库集合</Text>
                <Text type="secondary" className="block mb-3">
                  输入火山引擎方舟知识库的名称，支持添加多个
                </Text>

                {kbCollections.map((collection, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input
                      placeholder="请输入知识库名称"
                      value={collection}
                      onChange={(value) => updateKbCollection(index, value)}
                      allowClear
                      className="flex-1"
                    />

                    <Button
                      type="text"
                      status="danger"
                      icon={<IconDelete />}
                      onClick={() => removeKbCollection(index)}
                    />
                  </div>
                ))}

                <Button
                  type="dashed"
                  icon={<IconPlus />}
                  onClick={addKbCollection}
                  className="w-full"
                >
                  添加知识库集合
                </Button>
              </div>
            </CollapseItem>
          </Collapse>
        </>
      )}
    </CardWithTitle>
  );
};
