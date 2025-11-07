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

import { Message, Typography } from '@arco-design/web-react';
import { IconDashboard, IconInfoCircleFill } from '@arco-design/web-react/icon';
import type React from 'react';

import type { GlobalGuideStep } from '@/components/global-guide/lib';
import {
  exportGlobalGuideLogs,
  getGlobalGuideLogSession,
  isGlobalGuideLogCollecting,
  quickExportGlobalGuideLogs,
  startGlobalGuideLogCollection,
} from '@/components/global-guide/lib';
import style from './styles';

const { Text } = Typography;

interface LogExporterSectionProps {
  currentStepConfig: GlobalGuideStep | null;
}

export const LogExporterSection: React.FC<LogExporterSectionProps> = ({
  currentStepConfig,
}) => {
  const handleStartCollection = () => {
    try {
      // Check if collection is already in progress
      if (isGlobalGuideLogCollecting()) {
        const session = getGlobalGuideLogSession();
        Message.info({
          content: `日志收集已在进行中（会话ID: ${session?.sessionId || '未知'}）`,
        });
        return;
      }

      // Use dedicated GlobalGuide log collector
      const sessionId = startGlobalGuideLogCollection({
        featureId: 'goto-config',
        stepNumber: currentStepConfig?.number,
      });

      // Show success message
      Message.success({
        content: `日志收集已开始！会话ID: ${sessionId}\n\n现在请点击"前往配置"按钮，系统将自动收集全链路日志。\n\n完成后请点击"导出日志"按钮下载日志文件。`,
        duration: 5000,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Message.error(`开始收集日志失败: ${errorMessage}`);
    }
  };

  const handleExportLogs = () => {
    try {
      // Check if there is a session (allow export even if not in collection state)
      const session = getGlobalGuideLogSession();

      if (session) {
        // If there is a session, try to export (even if not in collection state)
        const filename = exportGlobalGuideLogs();
        if (filename) {
          Message.success(`日志已导出: ${filename}`);
        } else {
          // If export fails, try quick export as fallback
          const quickFilename = quickExportGlobalGuideLogs();
          if (quickFilename) {
            Message.success({
              content: `快速导出成功: ${quickFilename}\n\n（导出了最近5分钟的日志）`,
              duration: 5000,
            });
          } else {
            Message.warning('导出失败，请重试');
          }
        }
      } else {
        // If there is no active session, use quick export (export logs from the last 5 minutes)
        const filename = quickExportGlobalGuideLogs();
        if (filename) {
          Message.success({
            content: `快速导出成功: ${filename}\n\n（导出了最近5分钟的日志）`,
            duration: 5000,
          });
        } else {
          Message.warning({
            content:
              '没有可导出的日志。请先点击"开始收集"按钮，然后执行操作，再点击"导出日志"。',
            duration: 5000,
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Message.error(`导出日志失败: ${errorMessage}`);
    }
  };

  const handleCheckElements = () => {
    const selectors = [
      '#new-datasource-btn',
      '[data-testid="new-datasource-btn"]',
      '[data-testid="delete-datasource-btn"]',
      '[data-testid="edit-datasource-btn"]',
      '[data-testid="toggle-datasource-btn"]',
      '[data-testid="new-connection-btn"]',
      '[data-testid="edit-connection-btn"]',
      '[data-testid="test-connection-btn"]',
      '[data-testid="delete-connection-btn"]',
    ];

    selectors.forEach((selector) => {
      document.querySelector(selector);
    });
  };

  const handleQuickExport = () => {
    // Use quick export feature
    const filename = quickExportGlobalGuideLogs();
  };

  const handleCheckStatus = () => {
    const session = getGlobalGuideLogSession();
    const isCollecting = isGlobalGuideLogCollecting();
  };

  return (
    <div className={style.logExporterSection}>
      <div className="mt-4 p-3 bg-[#f5f5f5] rounded-lg">
        <Text className="text-xs text-[#666]">
          <IconDashboard className="text-sm mr-1" />
          日志导出工具
        </Text>
        <div className="mt-2 flex gap-2 flex-wrap">
          <button
            onClick={handleStartCollection}
            className="text-[11px] px-2 py-1 bg-[#1890ff] text-white border-none rounded cursor-pointer"
          >
            开始收集
          </button>
          <button
            onClick={handleExportLogs}
            className="text-[11px] px-2 py-1 bg-[#52c41a] text-white border-none rounded cursor-pointer"
          >
            导出日志
          </button>
          <button
            onClick={handleCheckElements}
            className="text-[11px] px-2 py-1 bg-[#fa8c16] text-white border-none rounded cursor-pointer"
          >
            检查元素
          </button>
          <button
            onClick={handleQuickExport}
            className="text-[11px] px-2 py-1 bg-[#722ed1] text-white border-none rounded cursor-pointer"
          >
            快速导出
          </button>
          <button
            onClick={handleCheckStatus}
            className="text-[11px] px-2 py-1 bg-[#fa8c16] text-white border-none rounded cursor-pointer"
          >
            收集状态
          </button>
        </div>
        <div className="mt-2 text-[10px] text-[#999] flex items-center">
          <IconInfoCircleFill className="text-xs mr-1" />
          使用说明：1. 点击"开始收集" → 2. 点击"前往配置" → 3. 点击"导出日志"
        </div>
      </div>
    </div>
  );
};
