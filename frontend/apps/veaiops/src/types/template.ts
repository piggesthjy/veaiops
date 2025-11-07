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
 * 指标类型枚举
 */
export enum MetricType {
  /** 自定义 */
  SelfDefined = 'SelfDefined',
  /** 成功率 (0-1) */
  SuccessRate = 'SuccessRate',
  /** 成功率 (0-100) */
  SuccessRate100 = 'SuccessRate100',
  /** 错误率 (0-1) */
  ErrorRate = 'ErrorRate',
  /** 错误率 (0-100) */
  ErrorRate100 = 'ErrorRate100',
  /** Counter类型指标的rate计算结果 */
  CounterRate = 'CounterRate',
  /** 计数值 */
  Count = 'Count',
  /** 错误计数 */
  ErrorCount = 'ErrorCount',
  /** 致命错误计数 */
  FatalErrorCount = 'FatalErrorCount',
  /** 延迟 (毫秒) */
  Latency = 'Latency',
  /** 延迟 (秒) */
  LatencySecond = 'LatencySecond',
  /** 延迟 (微秒) */
  LatencyMicrosecond = 'LatencyMicrosecond',
  /** 资源利用率 (0-1) */
  ResourceUtilizationRate = 'ResourceUtilizationRate',
  /** 资源利用率 (0-100) */
  ResourceUtilizationRate100 = 'ResourceUtilizationRate100',
  /** CPU使用核数 */
  CPUUsedCore = 'CPUUsedCore',
  /** 内存使用字节数 */
  MemoryUsedBytes = 'MemoryUsedBytes',
  /** 吞吐量 */
  Throughput = 'Throughput',
}

/**
 * 指标模板接口
 */
export interface MetricTemplate {
  /** 模板ID */
  id?: string;
  /** 模板名称 */
  name: string;
  /** 指标类型 */
  metric_type: MetricType;
  /** 最小步长 */
  min_step: number;
  /** 最大值 */
  max_value: number;
  /** 最小值 */
  min_value: number;
  /** 最小违规值 */
  min_violation: number;
  /** 最小违规比例 */
  min_violation_ratio: number;
  /** 正常范围开始值 */
  normal_range_start: number;
  /** 正常范围结束值 */
  normal_range_end: number;
  /** 缺失值填充 */
  missing_value?: string;
  /** 单次异常消除周期 */
  failure_interval_expectation: number;
  /** 显示单位 */
  display_unit: string;
  /** 显示系数 */
  linear_scale: number;
  /** 最大无数据时间间隔 */
  max_time_gap: number;
  /** 最小时序长度 */
  min_ts_length: number;
  /** 创建时间 */
  created_at?: string;
  /** 更新时间 */
  updated_at?: string;
  /** 删除时间 */
  deleted_at?: string;
}

/**
 * 创建模板请求
 */
export interface CreateTemplateRequest {
  /** 模板名称 */
  name: string;
  /** 指标类型 */
  metric_type: MetricType;
  /** 最小步长 */
  min_step: number;
  /** 最大值 */
  max_value: number;
  /** 最小值 */
  min_value: number;
  /** 最小违规值 */
  min_violation: number;
  /** 最小违规比例 */
  min_violation_ratio: number;
  /** 正常范围开始值 */
  normal_range_start: number;
  /** 正常范围结束值 */
  normal_range_end: number;
  /** 缺失值填充 */
  missing_value?: string;
  /** 单次异常消除周期 */
  failure_interval_expectation: number;
  /** 显示单位 */
  display_unit: string;
  /** 显示系数 */
  linear_scale: number;
  /** 最大无数据时间间隔 */
  max_time_gap: number;
  /** 最小时序长度 */
  min_ts_length: number;
}

/**
 * 更新模板请求
 */
export type UpdateTemplateRequest = Partial<CreateTemplateRequest>;

/**
 * 模板查询参数
 */
export interface TemplateQueryParams {
  /** 页码 */
  page?: number;
  /** 每页大小 */
  size?: number;
  /** 模板名称搜索 */
  name?: string;
  /** 指标类型筛选 */
  metric_type?: MetricType;
}

/**
 * 模板列表响应
 */
export interface TemplateListResponse {
  /** 模板列表 */
  items: MetricTemplate[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页大小 */
  size: number;
}

/**
 * API响应包装
 */
export interface APIResponse<T = unknown> {
  /** 状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data?: T;
}
