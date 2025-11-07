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
 * 项目管理相关常量、配置和工具函数
 */

import { exportLogsToFile as utilsExportLogsToFile } from "@veaiops/utils";
import type { Project } from "api-generate";
import type { ProjectFormData, ProjectStatus, ProjectPriority } from '@project/types';
import {
  createProject as apiCreateProject,
  deleteProject as apiDeleteProject,
  importProjects as apiImportProjects,
} from "./api";
import apiClient from "@/utils/api-client";

// 导出本地常量定义（模块特定）
export * from "./constants";

// 项目状态配置
export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { color: string; text: string }
> = {
  planning: { color: "blue", text: "规划中" },
  active: { color: "green", text: "进行中" },
  suspended: { color: "orange", text: "暂停" },
  completed: { color: "gray", text: "已完成" },
  cancelled: { color: "red", text: "已取消" },
};

// 项目优先级配置
export const PROJECT_PRIORITY_CONFIG: Record<
  ProjectPriority,
  { color: string; text: string }
> = {
  low: { color: "green", text: "低" },
  medium: { color: "blue", text: "中" },
  high: { color: "orange", text: "高" },
  urgent: { color: "red", text: "紧急" },
};

// 项目状态选项
export const PROJECT_STATUS_OPTIONS = [
  { label: "全部", value: "" },
  { label: "规划中", value: "planning" },
  { label: "进行中", value: "active" },
  { label: "暂停", value: "suspended" },
  { label: "已完成", value: "completed" },
  { label: "已取消", value: "cancelled" },
];

// 项目优先级选项
export const PROJECT_PRIORITY_OPTIONS = [
  { label: "全部", value: "" },
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
  { label: "紧急", value: "urgent" },
];

/**
 * 获取项目列表（模拟数据）
 */
export const getProjectList = async (
  _params: Record<string, any>
): Promise<{
  data: Project[];
  total: number;
}> => {
  const response =
    await apiClient.projects.getApisV1ManagerSystemConfigProjects({});
  return {
    data: response.data || [],
    total: response.data?.length || 0,
  };
};

// ✅ 已拆分：从 utils 目录统一导出
export {
  formatBudget,
  formatDate,
  formatDateTime,
  formatProgress,
  formatProjectPriority,
  formatProjectStatus,
} from './utils/formatters';

export {
  validateDate,
  validateDateRange,
  validateProjectFormData,
} from './utils/validators';

export {
  transformFormDataToProject,
  transformProjectToFormData,
} from './utils/transformers';

export {
  canDeleteProject,
  exportProjectsToCSV,
  filterProjects,
  generateProjectId,
  getDeleteRestrictionReason,
  getProjectStats,
  sortProjects,
} from './utils/helpers';

/**
 * 创建项目 - 重新导出api.ts中的实现
 */
export const createProject = apiCreateProject;

/**
 * 删除项目 - 包装api.ts中的实现
 */
export const deleteProject = async (projectId: string): Promise<boolean> => {
  const result = await apiDeleteProject(projectId);
  return result.success;
};

// transformProjectToFormData 和 validateProjectFormData 已从 utils/transformers 和 utils/validators 导出

/**
 * 项目验证规则
 */
export const PROJECT_VALIDATION_RULES = {
  name: {
    required: true,
    maxLength: 50,
  },
  description: {
    maxLength: 200,
  },
  budget: {
    min: 0,
  },
  progress: {
    min: 0,
    max: 100,
  },
};

/**
 * 导出调试日志
 */
export const exportDebugLogs = (filename: string): void => {
  utilsExportLogsToFile(filename);
};

/**
 * 导入项目 - 包装api.ts中的实现
 */
export const importProjects = async (file: File): Promise<boolean> => {
  const result = await apiImportProjects(file);
  return result.success;
};

// 导出表格配置相关
export * from "./table-columns";
export * from "./table-config";
