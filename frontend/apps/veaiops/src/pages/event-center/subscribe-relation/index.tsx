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
 * 事件中心订阅关系页面
 * @description 显示事件订阅管理（智能体订阅规则），支持筛选和管理
 *
 * 功能对照（与 origin/feat/web-v2 保持一致）：
 * - 筛选器：名称、智能体（内容识别Agent + 智能阈值Agent）、事件级别、是否开启WEBHOOK、关注项目
 * - 表格列：名称、智能体、生效开始时间、生效结束时间、事件级别、是否开启WEBHOOK、WEBHOOK地址、操作
 * - 默认筛选：智能体 = 内容识别Agent
 */
const EventCenterSubscribeRelation: React.FC = () => {
  return <EventSubscriptionPage moduleType={ModuleType.EVENT_CENTER} />;
};

export default EventCenterSubscribeRelation;
