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

import { Drawer, Typography } from '@arco-design/web-react';
import type React from 'react';
import { useState } from 'react';

import { CollapsibleSection } from '../base';
// 导入子组件
import {
  BasicInfo,
  ChannelMessage,
  EventOverview,
  RawData,
  TimeInfo,
} from '../business';

// 导入常量和工具函数
import {
  DEFAULT_EXPANDED_SECTIONS,
  EVENT_LEVEL_VISUAL_MAP,
  type HistoryDetailDrawerProps,
  STYLES,
  toggleSection,
} from '@ec/shared';

const { Title } = Typography;

/**
 * 历史事件详情抽屉组件
 * 提供事件详细信息的查看功能，采用现代化设计理念
 */
export const HistoryDetailDrawer: React.FC<HistoryDetailDrawerProps> = ({
  visible,
  selectedRecord,
  onClose,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    DEFAULT_EXPANDED_SECTIONS,
  );
  const [rawDataFormat, setRawDataFormat] = useState<'json' | 'formatted'>(
    'formatted',
  );

  if (!selectedRecord) {
    return null;
  }

  const handleToggleSection = (section: string) => {
    toggleSection(expandedSections, setExpandedSections, section);
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-6 rounded-sm"
            style={{
              backgroundColor:
                EVENT_LEVEL_VISUAL_MAP[selectedRecord.event_level]?.color ||
                STYLES.TEXT_SECONDARY,
            }}
          />
          <div className="flex items-center gap-2">
            <Title
              heading={5}
              style={{ margin: 0, color: STYLES.TEXT_PRIMARY }}
            >
              事件详情
            </Title>
          </div>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      focusLock={false}
      style={{
        background: STYLES.BACKGROUND_PAGE,
      }}
      headerStyle={{
        borderBottom: STYLES.CARD_BORDER,
        backgroundColor: '#FFFFFF',
        padding: '16px 24px',
      }}
    >
      <div className="min-h-full">
        {/* 事件概览卡片 */}
        <EventOverview selectedRecord={selectedRecord} />

        {/* 基础信息章节 */}
        <CollapsibleSection
          title="基础信息"
          sectionKey="basic"
          expandedSections={expandedSections}
          onToggle={handleToggleSection}
        >
          <BasicInfo selectedRecord={selectedRecord} />
        </CollapsibleSection>

        {/* 时间信息章节 */}
        <CollapsibleSection
          title="时间信息"
          sectionKey="time"
          expandedSections={expandedSections}
          onToggle={handleToggleSection}
        >
          <TimeInfo selectedRecord={selectedRecord} />
        </CollapsibleSection>

        {/* 渠道消息章节 */}
        {selectedRecord.channel_msg &&
          Object.keys(selectedRecord.channel_msg).length > 0 && (
            <CollapsibleSection
              title="渠道消息"
              sectionKey="channel"
              expandedSections={expandedSections}
              onToggle={handleToggleSection}
              collapsedHint="轻触探索"
            >
              <ChannelMessage selectedRecord={selectedRecord} />
            </CollapsibleSection>
          )}

        {/* 原始数据章节 */}
        <CollapsibleSection
          title="原始数据"
          sectionKey="rawData"
          expandedSections={expandedSections}
          onToggle={handleToggleSection}
        >
          <RawData
            selectedRecord={selectedRecord}
            format={rawDataFormat}
            onFormatChange={setRawDataFormat}
          />
        </CollapsibleSection>
      </div>
    </Drawer>
  );
};

export default HistoryDetailDrawer;
