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
 * CustomTable 性能测试控制面板
 * @description 提供可视化的性能监控界面

 *
 */

import {
  Alert,
  Button,
  Card,
  Grid,
  Progress,
  Space,
  Statistic,
  Typography,
} from '@arco-design/web-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { performanceLogger } from './performance-logger';

const { Text } = Typography;
const { Row, Col } = Grid;

interface PerformanceStats {
  totalRenders: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  renderFrequency: number;
  componentBreakdown: Record<string, number>;
}

/**
 * 性能控制面板组件
 */
export const PerformancePanel: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 自动刷新统计数据
  useEffect(() => {
    if (!autoRefresh || !isMonitoring) {
      return undefined;
    }

    const interval = setInterval(() => {
      setStats(performanceLogger.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, isMonitoring]);

  // 开始监控
  const handleStartMonitoring = () => {
    performanceLogger.enable();
    setIsMonitoring(true);
    setStats(performanceLogger.getStats());
  };

  // 停止监控
  const handleStopMonitoring = () => {
    performanceLogger.disable();
    setIsMonitoring(false);
  };

  // 导出日志
  const handleExportLogs = () => {
    performanceLogger.exportLogs();
  };

  // 清空日志
  const handleClearLogs = () => {
    performanceLogger.clear();
    setStats(null);
  };

  // 手动刷新
  const handleRefresh = () => {
    if (isMonitoring) {
      setStats(performanceLogger.getStats());
    }
  };

  return (
    <Card
      title="CustomTable 性能监控面板"
      style={{ width: '100%', marginBottom: 16 }}
      extra={
        <Space>
          {!isMonitoring ? (
            <Button type="primary" onClick={handleStartMonitoring}>
              开始监控
            </Button>
          ) : (
            <Button onClick={handleStopMonitoring}>停止监控</Button>
          )}
          <Button onClick={handleRefresh} disabled={!isMonitoring}>
            刷新
          </Button>
          <Button onClick={handleExportLogs} disabled={!stats}>
            导出日志
          </Button>
          <Button onClick={handleClearLogs}>清空日志</Button>
        </Space>
      }
    >
      {!isMonitoring && !stats && (
        <Alert
          type="info"
          content="点击开始监控按钮开始收集 CustomTable 的性能数据"
          style={{ marginBottom: 16 }}
        />
      )}

      {isMonitoring && (
        <Alert
          type="success"
          content="性能监控已启用，正在实时收集数据..."
          style={{ marginBottom: 16 }}
        />
      )}

      {stats && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic
                title="总渲染次数"
                value={stats.totalRenders}
                suffix="次"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均渲染时间"
                value={stats.averageRenderTime}
                precision={2}
                suffix="ms"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最大渲染时间"
                value={stats.maxRenderTime}
                precision={2}
                suffix="ms"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="渲染频率"
                value={stats.renderFrequency}
                precision={2}
                suffix="次/秒"
              />
            </Col>
          </Row>

          {/* 性能指标评估 */}
          <Card size="small" title="性能评估" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>平均渲染时间: </Text>
                <Progress
                  percent={Math.min((stats.averageRenderTime / 50) * 100, 100)}
                  status={stats.averageRenderTime > 16 ? 'error' : 'success'}
                  size="small"
                  showText={false}
                />
                <Text style={{ marginLeft: 8 }}>
                  {stats.averageRenderTime > 16 ? '需要优化' : '性能良好'}
                </Text>
              </div>
              <div>
                <Text>渲染频率: </Text>
                <Progress
                  percent={Math.min((stats.renderFrequency / 60) * 100, 100)}
                  status={stats.renderFrequency > 60 ? 'error' : 'success'}
                  size="small"
                  showText={false}
                />
                <Text style={{ marginLeft: 8 }}>
                  {stats.renderFrequency > 60 ? '渲染过于频繁' : '渲染频率正常'}
                </Text>
              </div>
            </Space>
          </Card>

          {/* 组件渲染次数分解 */}
          <Card size="small" title="组件渲染次数分解">
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(stats.componentBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([component, count]) => (
                  <div
                    key={component}
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Text>{component}</Text>
                    <Text bold>{count} 次</Text>
                  </div>
                ))}
            </Space>
          </Card>
        </>
      )}
    </Card>
  );
};
