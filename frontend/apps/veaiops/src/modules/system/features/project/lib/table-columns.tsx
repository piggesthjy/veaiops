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

import {
  Button,
  Popconfirm,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import type { ColumnProps } from "@arco-design/web-react/es/Table";
import { IconDelete } from "@arco-design/web-react/icon";
import type { Project } from 'api-generate';
import { CellRender } from "@veaiops/components";
import type { ProjectTableActions } from '@project/types';

// 解构CellRender组件，避免重复调用
const { CustomOutlineTag } = CellRender;

const { Ellipsis: EllipsisRender, StampTime: StampTimeRender } = CellRender;

const { Text } = Typography;

/**
 * 获取项目表格列配置
 */
export const getProjectTableColumns = (
  actions: ProjectTableActions
): ColumnProps<Project>[] => [
  {
    title: "项目ID",
    dataIndex: "project_id",
    key: "project_id",
    width: 200,
    render: (projectId: string) => <EllipsisRender text={projectId} />,
  },
  {
    title: "项目名称",
    dataIndex: "name",
    key: "name",
    width: 300,
    render: (name: string) => <Text className="font-bold">{name}</Text>,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 100,
    render: (status: string, record: Project) => (
      <CustomOutlineTag className="rounded-xl">
        {record.is_active ? "活跃" : "停用"}
      </CustomOutlineTag>
    ),
  },
  {
    title: "创建时间",
    dataIndex: "created_at",
    key: "created_at",
    width: 180,
    render: (createdAt: string) => (
      <StampTimeRender time={createdAt} />
    ),
  },
  {
    title: "更新时间",
    dataIndex: "updated_at",
    key: "updated_at",
    width: 180,
    render: (updatedAt: number) => <StampTimeRender time={updatedAt} />,
  },
  {
    title: "操作",
    key: "actions",
    width: 150,
    fixed: "right" as const,

    render: (_: unknown, record: Project) => (
      <Popconfirm
        title="确认删除"
        content={`确定要删除项目 "${record.name}" 吗？此操作不可恢复。`}
        onOk={() => actions.onDelete(record.project_id || "")}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ status: "danger" }}
      >
        <Tooltip content="删除项目">
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<IconDelete />}
            data-testid="delete-project-btn"
          />
        </Tooltip>
      </Popconfirm>
    ),
  },
];
