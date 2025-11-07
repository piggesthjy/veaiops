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

import { Card, Form } from '@arco-design/web-react';
import type React from 'react';
import {
  AlarmLevelSelector,
  AlertMethodsSelector,
  ContactGroupSelector,
} from './selectors';

interface AlarmConfigFormProps {
  form: any;
  loading: boolean;
  datasourceType: string;
  datasourceId: string;
}

/**
 * 告警配置表单组件
 *
 * 用于配置智能阈值任务的告警规则，包括：
 * 1. 告警级别（所有数据源必需）
 * 2. 联系组（Volcengine 和 Aliyun 可选）
 * 3. 告警通知方式（仅 Volcengine 可选）
 *
 * @param form - Arco Form 实例
 * @param loading - 加载状态
 * @param datasourceType - 数据源类型（Volcengine | Aliyun | Zabbix）
 * @param datasourceId - 数据源ID
 */
export const AlarmConfigForm: React.FC<AlarmConfigFormProps> = ({
  form,
  loading,
  datasourceType,
  datasourceId,
}) => {
  // 判断是否需要显示告警通知方式选择器
  const showAlertMethods = ['Volcengine', 'Zabbix'].includes(datasourceType);

  return (
    <Card
      title="全局告警配置"
      style={{
        marginBottom: 16,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
    >
      <Form layout="vertical" form={form} disabled={loading}>
        {/* 告警级别 - 所有数据源都需要 */}
        <AlarmLevelSelector loading={loading} />

        {/* 告警通知方式 - 仅 Volcengine 和 Zabbix 需要 */}
        {showAlertMethods && (
          <AlertMethodsSelector
            loading={loading}
            datasourceType={datasourceType}
            datasourceId={datasourceId}
          />
        )}

        {/* 联系组 */}
        <ContactGroupSelector
          loading={loading}
          datasourceType={datasourceType}
          datasourceId={datasourceId}
        />
      </Form>
    </Card>
  );
};
