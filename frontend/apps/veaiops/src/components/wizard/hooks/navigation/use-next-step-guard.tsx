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

/**
 * 下一步操作前置校验（拆分模块）
 * @description 提供 GuidedWizard / DataSourceWizard 通用的"下一步"拦截校验，提升可读性与可复用性
 * - 包含阿里云和火山引擎在监控项(metric)步骤的 Region 校验
 * - 后续可以在此文件继续扩展其他数据源与步骤的前置校验
 */

import { Modal } from '@arco-design/web-react';

import React from 'react';
import { AliyunRegionPrompt, VolcengineRegionPrompt } from '../../steps/shared';
import type { WizardState } from '../../types';
import { DataSourceType } from '../../types';

/**
 * Region 校验参数
 */
export interface RegionGuardParams {
  selectedType: DataSourceType | null;
  currentStepKey: string;
  state: WizardState;
}

/**
 * 阿里云 connect 步骤 Region 前置校验
 * @description Region 输入已移到连接选择步骤，在连接选择完成后验证
 * @returns boolean - true: 通过校验；false: 未通过（已弹窗提示）
 */
export const guardAliyunConnectRegion = ({
  selectedType,
  currentStepKey,
  state,
}: RegionGuardParams): boolean => {
  if (selectedType === DataSourceType.ALIYUN && currentStepKey === 'connect') {
    // 从 state.aliyun.region 读取（用户在连接选择步骤输入）
    const region = (state.aliyun.region || '').trim();
    if (!region) {
      Modal.confirm({
        title: '请填写 Region',
        content: <AliyunRegionPrompt />,
        okText: '返回填写',
        cancelButtonProps: { style: { display: 'none' }, disabled: true },
      });

      return false;
    }
  }
  return true;
};

/**
 * 火山引擎 connect 步骤 Region 前置校验
 * @description Region 输入已移到连接选择步骤，在连接选择完成后验证
 * @returns boolean - true: 通过校验；false: 未通过（已弹窗提示）
 */
export const guardVolcengineConnectRegion = ({
  selectedType,
  currentStepKey,
  state,
}: RegionGuardParams): boolean => {
  if (
    selectedType === DataSourceType.VOLCENGINE &&
    currentStepKey === 'connect'
  ) {
    const region = (state.volcengine.region || '').trim();
    if (!region) {
      Modal.confirm({
        title: '请填写 Region',
        content: <VolcengineRegionPrompt />,
        okText: '返回填写',
        cancelButtonProps: { style: { display: 'none' }, disabled: true },
      });

      return false;
    }
  }
  return true;
};
