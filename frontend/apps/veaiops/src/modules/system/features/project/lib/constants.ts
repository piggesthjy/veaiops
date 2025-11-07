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

import type { ProjectStatus, ProjectPriority } from '@project/types';

/**
 * 项目管理配置常量
 */
export const PROJECT_MANAGEMENT_CONFIG = {
  title: "项目管理",
  pageSize: 10,
  maxNameLength: 100,
  maxDescriptionLength: 1000,
  maxOwnerLength: 50,
  maxBudget: 10000000, // 1000万
  minProgress: 0,
  maxProgress: 100,
} as const;

/**
 * 项目状态配置
 */
export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { text: string; color: string }
> = {
  planning: { text: "规划中", color: "blue" },
  active: { text: "进行中", color: "green" },
  suspended: { text: "已暂停", color: "orange" },
  completed: { text: "已完成", color: "arcoblue" },
  cancelled: { text: "已取消", color: "red" },
} as const;

/**
 * 项目优先级配置
 */
export const PROJECT_PRIORITY_CONFIG: Record<
  ProjectPriority,
  { text: string; color: string }
> = {
  low: { text: "低", color: "gray" },
  medium: { text: "中", color: "blue" },
  high: { text: "高", color: "orange" },
  urgent: { text: "紧急", color: "red" },
} as const;

/**
 * 项目状态选项
 */
export const PROJECT_STATUS_OPTIONS = [
  { label: "全部状态", value: "" },
  { label: "规划中", value: "planning" },
  { label: "进行中", value: "active" },
  { label: "已暂停", value: "suspended" },
  { label: "已完成", value: "completed" },
  { label: "已取消", value: "cancelled" },
] as const;

/**
 * 项目优先级选项
 */
export const PROJECT_PRIORITY_OPTIONS = [
  { label: "全部优先级", value: "" },
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
  { label: "紧急", value: "urgent" },
] as const;

/**
 * 项目表格列配置
 */
export const PROJECT_TABLE_COLUMNS = {
  name: { title: "项目名称", width: 200 },
  status: { title: "状态", width: 100 },
  priority: { title: "优先级", width: 100 },
  owner: { title: "负责人", width: 120 },
  progress: { title: "进度", width: 120 },
  budget: { title: "预算", width: 120 },
  start_date: { title: "开始时间", width: 120 },
  end_date: { title: "结束时间", width: 120 },
  created_at: { title: "创建时间", width: 150 },
  actions: { title: "操作", width: 200 },
} as const;

/**
 * 项目导入模板字段
 */
export const PROJECT_IMPORT_TEMPLATE_FIELDS = [
  "project_id",
  "name",
  "description",
  "status",
  "priority",
  "owner",
  "start_date",
  "end_date",
  "budget",
  "progress",
] as const;

/**
 * 项目验证规则
 */
export const PROJECT_VALIDATION_RULES = {
  name: {
    required: true,
    maxLength: PROJECT_MANAGEMENT_CONFIG.maxNameLength,
  },
  status: {
    required: true,
    enum: ["planning", "active", "suspended", "completed", "cancelled"],
  },
  priority: {
    required: true,
    enum: ["low", "medium", "high", "urgent"],
  },
  budget: {
    min: 0,
    max: PROJECT_MANAGEMENT_CONFIG.maxBudget,
  },
  progress: {
    min: PROJECT_MANAGEMENT_CONFIG.minProgress,
    max: PROJECT_MANAGEMENT_CONFIG.maxProgress,
  },
  start_date: {
    format: "YYYY-MM-DD",
  },
  end_date: {
    format: "YYYY-MM-DD",
  },
} as const;

/**
 * 项目进度颜色配置
 */
export const PROJECT_PROGRESS_COLORS = {
  low: "#f53f3f", // 0-30% 红色
  medium: "#ff7d00", // 31-70% 橙色
  high: "#00b42a", // 71-100% 绿色
} as const;

/**
 * 项目预算格式化配置
 */
export const PROJECT_BUDGET_CONFIG = {
  currency: "¥",
  locale: "zh-CN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
} as const;
