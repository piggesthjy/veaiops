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

import { createTableRequestWrapper } from "@veaiops/utils";
import { metricTemplateApi } from "./api-service";

/**
 * 获取指标模板列表
 * @param params - 包含分页和过滤参数的对象
 */
const fetchMetricTemplateList = async (params: Record<string, any>) => {
  // 从参数中提取查询条件
  const { name, metricType, skip, limit } = params;

  // 获取所有数据（因为后端不支持过滤，我们需要在前端过滤）
  // 使用一个较大的limit来获取所有数据
  const response = await metricTemplateApi.list({ skip: 0, limit: 10000 });
  let filteredData = response.data || [];

  // 在前端进行过滤
  if (name) {
    filteredData = filteredData.filter((item: any) =>
      item.name?.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (metricType !== undefined && metricType !== null) {
    filteredData = filteredData.filter(
      (item: any) => item.metric_type === metricType
    );
  }

  // 在前端进行分页
  const startIndex = skip || 0;
  const endIndex = startIndex + (limit || 10);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total: filteredData.length,
    success: true,
  };
};

/**
 * 创建指标模板表格请求包装器
 */
export const createMetricTemplateTableRequestWrapper = () =>
  createTableRequestWrapper({ apiCall: fetchMetricTemplateList, defaultLimit: 10 });
