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

import { Drawer, Space, Spin } from '@arco-design/web-react';
import { IconLink } from '@arco-design/web-react/icon';
import { AliyunConfig } from './aliyun-config';
import { BasicInfo } from './basic-info';
import { ConnectionConfig } from './connection-config';
import { Header } from './header';
import { TimeInfo } from './time-info';
import type { DatasourceDetailDrawerProps } from './types';
import { getTypeConfig } from './utils';
import { VolcengineConfig } from './volcengine-config';
import { ZabbixConfig } from './zabbix-config';

/**
 * 数据源详情抽屉组件
 *
 * 用于在智能阈值任务配置列表中查看关联数据源的详细信息
 *
 * ### 功能特性
 * - 美观的背景图 + 渐变顶部卡片
 * - 支持火山引擎、阿里云、Zabbix 三种数据源类型
 * - 动态展示各类型特定配置信息
 * - 自动翻译数据源类型为中文
 */
export const DatasourceDetailDrawer: React.FC<DatasourceDetailDrawerProps> = ({
  visible,
  datasource,
  loading,
  onClose,
}) => {
  if (!datasource && !loading) {
    return null;
  }

  const typeConfig = datasource ? getTypeConfig(datasource.type) : null;

  return (
    <Drawer
      title={
        <Space size={8}>
          <IconLink />
          <span>数据源详情</span>
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      width={680}
      placement="right"
      unmountOnExit
      footer={null}
    >
      <Spin loading={loading} className="w-full">
        {datasource && typeConfig && (
          <div>
            {/* 顶部卡片 */}
            <Header datasource={datasource} typeConfig={typeConfig} />

            {/* 基础信息 */}
            <BasicInfo datasource={datasource} />

            {/* 连接配置 */}
            <ConnectionConfig datasource={datasource} />

            {/* 火山引擎配置 */}
            <VolcengineConfig datasource={datasource} />

            {/* 阿里云配置 */}
            <AliyunConfig datasource={datasource} />

            {/* Zabbix 配置 */}
            <ZabbixConfig datasource={datasource} />

            {/* 时间信息 */}
            <TimeInfo datasource={datasource} />
          </div>
        )}
      </Spin>
    </Drawer>
  );
};
