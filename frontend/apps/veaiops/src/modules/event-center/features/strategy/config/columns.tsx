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

import { Button, Popconfirm, Space } from '@arco-design/web-react';
// ✅ Optimization: Use shortest path, merge imports from same source
import { adaptStrategyForEdit, channelInfoMap } from '@ec/strategy';
import { CellRender, type ModernTableColumnProps } from '@veaiops/components';
import type { InformStrategy } from 'api-generate';

const { CustomOutlineTag, Ellipsis, StampTime } = CellRender;

/**
 * Column configuration callback function type definition
 *
 * Type analysis (based on Python source code three-way comparison):
 * - Python InformStrategyVO (API response): bot: BotVO, group_chats: List[GroupChatVO]
 * - Python InformStrategyPayload (API request): bot_id: str, chat_ids: List[str]
 * - Frontend InformStrategy (api-generate) = InformStrategyVO (API response format)
 * - Edit form needs bot_id and chat_ids, transformed through adaptStrategyForEdit adapter
 *
 * According to .cursorrules: prioritize using types from api-generate (single source of truth principle)
 */
interface StrategyColumnsProps {
  // ✅ Unified use of InformStrategy (api-generate), conforms to single source of truth principle
  // Edit form will extract bot_id and chat_ids through adaptStrategyForEdit adapter
  onEdit?: (record: InformStrategy) => void;
  onDelete?: (id: string) => void;
}

/**
 * Strategy column configuration function
 * Provides complete column configuration following CustomTable best practices
 *
 * Return type is explicitly ModernTableColumnProps<InformStrategy>[], avoiding type assertions
 */
export const getStrategyColumns = (
  props: StrategyColumnsProps,
): ModernTableColumnProps<InformStrategy>[] => [
  {
    title: '策略名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
    fixed: 'left' as const,
    ellipsis: true,
  },
  {
    title: '企业协同工具',
    dataIndex: 'channel',
    key: 'channel',
    width: 120,
    render: (channel: string) => {
      return (
        <CustomOutlineTag>
          <Ellipsis
            text={channelInfoMap[channel]?.label}
            style={{ maxWidth: 100 }}
          />
        </CustomOutlineTag>
      );
    },
  },
  {
    title: '通知机器人',
    dataIndex: 'bot_name',
    key: 'bot_name',
    width: 160,
    ellipsis: true,
    render: (_: string, record: InformStrategy) => {
      if (!record?.bot?.name) {
        return '-';
      }
      return (
        <CustomOutlineTag>
          <Ellipsis text={record?.bot?.name} style={{ maxWidth: 100 }} />
        </CustomOutlineTag>
      );
    },
  },
  {
    title: '通知群',
    dataIndex: 'chat_names',
    key: 'chat_names',
    width: 300,
    render: (_: string, record: InformStrategy) => {
      if (!record?.group_chats?.length) {
        return '-';
      }

      // Transform group_chats data to format required by CustomOutlineTagList
      const tagData = record.group_chats.map((item, index: number) => ({
        name: item.chat_name || item.open_chat_id,
        key: `chat-${item.id || index}`,
        // Notification groups use default white outline style, no colorTheme set
      }));

      return (
        <CellRender.TagEllipsis
          dataList={tagData}
          maxCount={1}
          ellipsisTextStyle={{ maxWidth: 250 }}
        />
      );
    },
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    render: (value: string) => <StampTime time={value} />,
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    key: 'updated_at',
    width: 160,
    // sorter: true,
    render: (value: string) => <StampTime time={value} />,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: 200,
    ellipsis: true,
    render: (value: string) => {
      if (!value) {
        return '--';
      }
      return value;
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right' as const,
    render: (_: unknown, record: InformStrategy) => (
      <Space>
        <Button
          size="small"
          type="text"
          onClick={() => {
            // ✅ Type-safe: Use type adapter function to transform InformStrategy to format required by edit form
            //
            // Based on Python source code analysis (veaiops/schema/models/event/event.py):
            // - InformStrategyVO returns bot: BotVO and group_chats: List[GroupChatVO]
            // - Edit form needs flattened bot_id and chat_ids (conforms to EventStrategy interface requirements)
            // - adaptStrategyForEdit extracts these values from nested objects
            //
            // Type notes:
            // - record type: InformStrategy (from api-generate, corresponds to Python InformStrategyVO)
            // - adaptedStrategy type: AdaptedStrategyForEdit (InformStrategy & { bot_id: string; chat_ids: string[] })
            // - EventStrategy type: extends InformStrategy, includes optional bot_id and chat_ids
            // - Since AdaptedStrategyForEdit's bot_id and chat_ids are required, while EventStrategy has them optional, types are compatible
            // ✅ Pass InformStrategy directly, edit form will handle it through adaptStrategyForEdit adapter internally
            // According to .cursorrules: unified use of types from api-generate
            props.onEdit?.(record);
          }}
        >
          编辑
        </Button>
        <Popconfirm
          title="确定要删除这个策略吗？"
          content="删除后无法恢复，请谨慎操作。"
          onOk={() => props.onDelete?.(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button size="small" type="text" status="danger">
            删除
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];
