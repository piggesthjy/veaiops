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

import type { FormInstance } from '@arco-design/web-react';
// 导入并重新导出API生成的Project类型
import type { Project } from 'api-generate';

export type { Project };

/**
 * 项目状态枚举
 */
export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'suspended'
  | 'completed'
  | 'cancelled';

/**
 * 项目优先级枚举
 */
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * 项目表单数据接口 - 用于创建项目时的表单数据
 */
export interface ProjectFormData {
  /** 项目ID */
  project_id: string;
  /** 项目名称 */
  name: string;
  /** 负责人 */
  owner?: string;
  /** 项目描述 */
  description?: string;
  /** 项目状态 */
  status?: string;
  /** 优先级 */
  priority?: string;
  /** 项目进度 */
  progress?: number;
  /** 开始时间 */
  start_date?: string;
  /** 结束时间 */
  end_date?: string;
  /** 预算金额 */
  budget?: number;
  /** 是否激活 */
  is_active?: boolean;
}

/**
 * 项目表格组件属性接口
 */
export interface ProjectTableProps {
  onDelete: (projectId: string) => Promise<boolean>;
  onImport: () => void;
  onCreate: () => void;
}

/**
 * 项目列表表格组件属性接口
 */
export interface ProjectListTableProps {
  data: Project[];
  loading: boolean;
  onView?: (project: Project) => void;
  onDelete: (projectId: string) => Promise<boolean>;
}

/**
 * 项目表格操作接口
 */
export interface ProjectTableActions {
  onView?: (project: Project) => void;
  onDelete: (projectId: string) => Promise<boolean>;
}

/**
 * 项目弹窗组件属性接口
 */
export interface ProjectModalProps {
  visible: boolean;
  editingProject: Project | null;
  onCancel: () => void;
  onSubmit: (values: ProjectFormData) => Promise<boolean>;
  form: FormInstance<ProjectFormData>;
  submitting?: boolean;
}
