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

import { EventSubscriptionPage } from '@/modules/event-center/pages';
import { ModuleType } from '@/types/module';
import type React from 'react';

/**
 * Oncall异动 - 事件订阅页面
 * @description 显示智能体订阅规则管理（内容识别Agent），支持筛选和管理事件订阅
 *
 * 功能对照（与 origin/feat/web-v2 保持一致）：
 * - 筛选器：名称、智能体（内容识别Agent）、事件级别、是否开启WEBHOOK
 * - 表格列：名称、生效开始时间、生效结束时间、事件级别、是否开启WEBHOOK、WEBHOOK地址、操作
 */
const OncallRulesPage: React.FC = () => {
  return <EventSubscriptionPage moduleType={ModuleType.ONCALL} />;
};

export default OncallRulesPage;
