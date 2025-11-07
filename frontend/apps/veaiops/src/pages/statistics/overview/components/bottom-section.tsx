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

import { Grid } from '@arco-design/web-react';
import type { SystemStatistics } from 'api-generate';
import type React from 'react';
import type { SystemOverviewData } from '../types';
import { SystemResourceOverview } from './system-resource-overview';
import { ThresholdDetailedStatistics } from './threshold-detailed-statistics';

const { Row, Col } = Grid;

interface BottomSectionProps {
  statistics: SystemStatistics | null;
  getSystemOverviewData: () => SystemOverviewData[];
}

/**
 * 底部区域组件
 * @description 将智能阈值任务详细统计和系统资源概览放在同一行
 */
export const BottomSection: React.FC<BottomSectionProps> = ({
  statistics,
  getSystemOverviewData,
}) => {
  return (
    <Row gutter={16}>
      {/* 智能阈值任务详细统计 */}
      <Col span={12}>
        <ThresholdDetailedStatistics statistics={statistics} />
      </Col>

      {/* 系统资源概览 */}
      <Col span={12}>
        <SystemResourceOverview getSystemOverviewData={getSystemOverviewData} />
      </Col>
    </Row>
  );
};

export default BottomSection;
