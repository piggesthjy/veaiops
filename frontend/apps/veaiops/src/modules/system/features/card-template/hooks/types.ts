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
 * Card Template Hook 类型定义
 */

import type { Form } from '@arco-design/web-react';
import type {
  BaseQuery,
  FieldItem,
  HandleFilterProps,
  ModernTableColumnProps,
  QueryFormat,
  useBusinessTable,
} from '@veaiops/components';
import type {
  AgentTemplate,
  AgentTemplateCreateRequest,
  AgentTemplateUpdateRequest,
} from 'api-generate';
import type React from 'react';

/**
 * Card Template 表格配置 Hook 的选项类型
 */
export interface UseCardTemplateTableConfigOptions {
  onEdit?: (record: AgentTemplate) => Promise<boolean>;
  onDelete?: (templateId: string) => Promise<boolean>;
  onCreate?: () => Promise<boolean>;
  onToggleStatus?: (templateId: string, status: boolean) => Promise<boolean>;
  /**
   * 表格 ref，用于刷新操作
   * 如果不传入，会在内部创建新的 ref
   */
  ref?: React.RefObject<
    import('@veaiops/components').CustomTableActionType<
      AgentTemplate,
      BaseQuery
    >
  >;
}

/**
 * Card Template 表格配置 Hook 的返回值类型
 */
export interface UseCardTemplateTableConfigReturn {
  // 表格配置
  customTableProps: Record<string, unknown>;
  customOperations: ReturnType<typeof useBusinessTable>['customOperations'];
  handleColumns: (
    props?: Record<string, unknown>,
  ) => ModernTableColumnProps<AgentTemplate>[];
  handleFilters: (props: HandleFilterProps<BaseQuery>) => FieldItem[];
  renderActions: (props?: Record<string, unknown>) => React.ReactNode[];
  queryFormat: QueryFormat;

  // 业务逻辑状态
  modalVisible: boolean;
  editingTemplate: AgentTemplate | null;
  form: ReturnType<typeof Form.useForm>[0];

  // 业务逻辑处理器
  handleEdit: (template: AgentTemplate) => void; // 只负责打开弹窗，不需要返回值
  handleAdd: () => void; // 只负责打开弹窗，不需要返回值
  handleCancel: () => void;
  handleSubmit: (
    values: AgentTemplateCreateRequest | AgentTemplateUpdateRequest,
  ) => Promise<boolean>;
  handleDelete: (templateId: string) => Promise<boolean>;
}
