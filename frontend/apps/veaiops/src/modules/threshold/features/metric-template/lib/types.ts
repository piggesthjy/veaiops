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

// 优化：优先使用 api-generate 中的类型定义
/**
 * 指标模板表格数据类型
 * 基于 api-generate 中的 MetricTemplate，仅添加前端特有字段
 * Note: 直接使用后端的 snake_case 命名，保持与 API 一致
 */
import type { MetricTemplate } from "api-generate";

export type { MetricTemplate } from "api-generate";
export type { MetricTemplateCreateRequest } from "api-generate";
export type { MetricTemplateUpdateRequest } from "api-generate";
export type { APIResponseMetricTemplate } from "api-generate";
export type { PaginatedAPIResponseMetricTemplateList } from "api-generate";

export interface MetricTemplateTableData extends MetricTemplate {
  key?: string; // 表格行的唯一标识，用于前端渲染
}

/**
 * 指标模板筛选参数
 */
export interface MetricTemplateFilterParams {
  name?: string;
  metricType?: string;
  skip?: number;
  limit?: number;
}

/**
 * 指标模板操作类型
 */
export type MetricTemplateAction = "create" | "edit" | "delete" | "view";

/**
 * 指标模板模态框状态
 */
export interface MetricTemplateModalState {
  visible: boolean;
  action: MetricTemplateAction;
  template?: MetricTemplate;
}
