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

import resourceImage from '@/assets/resource.png';
import { ModernCard } from '@/components/ui';
import type React from 'react';
import type { SystemOverviewData } from '../types';

interface SystemResourceOverviewProps {
  getSystemOverviewData: () => SystemOverviewData[];
}

/**
 * 系统资源概览组件
 * @description 展示系统各模块资源使用情况统计
 */
export const SystemResourceOverview: React.FC<SystemResourceOverviewProps> = ({
  getSystemOverviewData,
}) => {
  // 将系统概览数据转换为 ModernCard 的 statistics 格式
  const systemOverviewStats = getSystemOverviewData().flatMap((category) =>
    category.items.map((item) => ({
      label: item.name,
      value: item.value,
      color: '#1890ff',
      icon: item.icon,
    })),
  );

  return (
    <ModernCard
      title="系统资源概览"
      description="系统各模块资源使用情况统计，包括用户管理、系统配置和通知管理等关键指标"
      backgroundImage={resourceImage}
      height={500}
      statistics={systemOverviewStats}
      buttonText=""
    />
  );
};

export default SystemResourceOverview;
