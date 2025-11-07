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
 * 重置日志导出按钮组件
 * 提供一键导出重置操作相关日志的功能
 */

import { devLog } from '@/custom-table/utils/log-utils';
import { performanceLogger } from '@/custom-table/utils/performance-logger';
import { resetLogAnalyzer } from '@/custom-table/utils/reset-log-analyzer';
import { resetLogCollector } from '@/custom-table/utils/reset-log-collector';
import { Button, Message, Modal } from '@arco-design/web-react';
import { IconDownload } from '@arco-design/web-react/icon';
import React, { useState } from 'react';

interface ResetLogExportButtonProps {
  /** 按钮文本 */
  text?: string;
  /** 按钮类型 */
  type?: 'primary' | 'secondary' | 'outline' | 'text';
  /** 按钮大小 */
  size?: 'mini' | 'small' | 'default' | 'large';
  /** 是否显示日志数量 */
  showCount?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 是否启用日志收集 */
  enableLogging?: boolean;
}

/**
 * 重置日志导出按钮
 */
export const ResetLogExportButton: React.FC<ResetLogExportButtonProps> = ({
  text = '导出日志',
  type = 'primary',
  size = 'default',
  showCount = true,
  style,
  className,
  enableLogging = true,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 获取日志统计信息
  const getLogStats = () => {
    const resetStats = resetLogCollector.getStats();
    const performanceStats = performanceLogger.getStats();
    const currentSession = resetLogCollector.getCurrentSession();

    return {
      reset: {
        totalSessions: resetStats.totalSessions,
        totalLogs: resetStats.totalLogs,
        errorRate: resetStats.errorRate || 0,
      },
      performance: {
        totalRenders: performanceStats.totalRenders,
      },
      currentSession: currentSession
        ? {
            id: currentSession.sessionId,
            logs: currentSession.logs.length,
            duration: Date.now() - currentSession.startTime,
          }
        : null,
    };
  };

  // 处理导出日志
  const handleExportLogs = async () => {
    if (!enableLogging) {
      Message.warning('日志收集功能未启用');
      return;
    }

    setIsExporting(true);

    try {
      // 确保当前会话结束
      if (resetLogCollector.getCurrentSession()) {
        resetLogCollector.endSession();
      }

      // 导出重置日志
      resetLogCollector.exportResetLogs();

      Message.success('重置日志导出成功');
    } catch (error: unknown) {
      // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      devLog.error({
        component: 'ResetLogExportButton',
        message: `导出日志失败: ${errorObj.message}`,
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
      });
      Message.error(`导出日志失败: ${errorObj.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 处理导出分析报告
  const handleExportAnalysis = async () => {
    if (!enableLogging) {
      Message.warning('日志收集功能未启用');
      return;
    }

    setIsExporting(true);

    try {
      // 导出分析报告
      resetLogAnalyzer.exportAnalysisReport();

      Message.success('分析报告导出成功');
    } catch (error: unknown) {
      // ✅ 正确：使用 devLog 记录错误，并透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      devLog.error({
        component: 'ResetLogExportButton',
        message: `导出分析报告失败: ${errorObj.message}`,
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
      });
      Message.error(`导出分析报告失败: ${errorObj.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 处理预览日志
  const handlePreviewLogs = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault(); // 阻止默认右键菜单
    }

    if (!enableLogging) {
      Message.warning('日志收集功能未启用');
      return;
    }

    setShowPreview(true);
  };

  // 预览日志内容
  const previewLogs = () => {
    const stats = getLogStats();
    const sessions = resetLogCollector.getAllSessions();
    const performanceStats = performanceLogger.getStats();

    return {
      metadata: {
        exportTime: new Date().toISOString(),
        totalResetSessions: stats.reset.totalSessions,
        totalResetLogs: stats.reset.totalLogs,
        totalPerformanceLogs: stats.performance.totalRenders,
        currentSession: stats.currentSession,
      },
      resetSessions: sessions.slice(-5), // 最近5个会话
      performanceStats, // 性能统计信息
    };
  };

  const stats = getLogStats();
  const totalLogs = stats.reset.totalLogs + stats.performance.totalRenders;

  return (
    <>
      <Button
        type={type}
        size={size}
        icon={<IconDownload />}
        loading={isExporting}
        onClick={handleExportLogs}
        onContextMenu={handlePreviewLogs}
        style={style}
        className={className}
      >
        {text}
        {showCount && totalLogs > 0 && ` (${totalLogs})`}
      </Button>

      {/* 分析报告导出按钮 */}
      <Button
        type="outline"
        size={size}
        icon={<IconDownload />}
        loading={isExporting}
        onClick={handleExportAnalysis}
        style={{ marginLeft: '8px', ...style }}
        className={className}
      >
        导出分析报告
      </Button>

      {/* 日志预览模态框 */}
      <Modal
        title="日志预览"
        visible={showPreview}
        onCancel={() => setShowPreview(false)}
        onOk={() => setShowPreview(false)}
        style={{ width: '800px', top: 20 }}
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              lineHeight: '1.4',
            }}
          >
            {JSON.stringify(previewLogs(), null, 2)}
          </pre>
        </div>
      </Modal>
    </>
  );
};

/**
 * 重置日志控制面板
 * 提供日志收集的开关和统计信息
 */
export const ResetLogControlPanel: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [stats, setStats] = useState<{
    reset: { totalSessions: number; totalLogs: number; errorRate: number };
    performance: { totalRenders: number };
    currentSession: { id: string; logs: number; duration: number } | null;
  } | null>(null);

  const getLogStats = () => {
    const resetStats = resetLogCollector.getStats();
    const performanceStats = performanceLogger.getStats();
    const currentSession = resetLogCollector.getCurrentSession();

    return {
      reset: {
        totalSessions: resetStats.totalSessions,
        totalLogs: resetStats.totalLogs,
        errorRate: resetStats.errorRate || 0,
      },
      performance: {
        totalRenders: performanceStats.totalRenders,
      },
      currentSession: currentSession
        ? {
            id: currentSession.sessionId,
            logs: currentSession.logs.length,
            duration: Date.now() - currentSession.startTime,
          }
        : null,
    };
  };

  const handleToggleLogging = () => {
    if (isEnabled) {
      resetLogCollector.disable();
      setIsEnabled(false);
    } else {
      resetLogCollector.enable();
      setIsEnabled(true);
    }
  };

  const handleRefreshStats = () => {
    setStats(getLogStats());
  };

  React.useEffect(() => {
    if (isEnabled) {
      const interval = setInterval(handleRefreshStats, 1000);
      return () => clearInterval(interval);
    }
    return () => undefined;
  }, [isEnabled, handleRefreshStats]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 9999,
        minWidth: '200px',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <Button
          type={isEnabled ? 'primary' : 'outline'}
          size="small"
          onClick={handleToggleLogging}
        >
          {isEnabled ? '停止收集' : '开始收集'}
        </Button>
      </div>

      {isEnabled && stats && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div>重置会话: {stats.reset.totalSessions}</div>
          <div>重置日志: {stats.reset.totalLogs}</div>
          <div>渲染次数: {stats.performance.totalRenders}</div>
          <div>错误率: {stats.reset.errorRate.toFixed(1)}%</div>
        </div>
      )}

      <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
        <ResetLogExportButton
          size="small"
          text="导出日志"
          enableLogging={isEnabled}
        />
        <Button
          size="small"
          type="outline"
          onClick={() => resetLogAnalyzer.exportAnalysisReport()}
          disabled={!isEnabled}
        >
          分析报告
        </Button>
      </div>
    </div>
  );
};

export default ResetLogExportButton;
