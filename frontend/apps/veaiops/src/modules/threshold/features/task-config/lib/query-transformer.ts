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
 * 查询转换器
 * 用于转换前端查询参数到API参数
 */

/**
 * 转换表格查询参数到API参数
 * @param params 表格查询参数
 * @returns API查询参数
 */
export const transformTableQueryToApi = (params: any): any => {
  const {
    current = 1,
    pageSize = 10,
    sorter,
    filters = {},
    ...otherParams
  } = params;

  const apiParams: any = {
    page: current,
    page_size: pageSize,
    ...otherParams,
  };

  // 处理排序
  if (sorter) {
    const { field, order } = sorter;
    if (field && order) {
      apiParams.order_by = order === "ascend" ? field : `-${field}`;
    }
  }

  // 处理过滤器
  Object.keys(filters).forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        apiParams[key] = value.join(",");
      } else {
        apiParams[key] = value;
      }
    }
  });

  return apiParams;
};

/**
 * 转换API响应到表格数据格式
 * @param response API响应
 * @returns 表格数据格式
 */
export const transformApiResponseToTable = (response: any) => {
  const { data, total, page, page_size } = response;

  return {
    data: data || [],
    total: total || 0,
    current: page || 1,
    pageSize: page_size || 10,
  };
};

/**
 * 转换表单数据到API数据
 * @param formData 表单数据
 * @returns API数据
 */
export const transformFormDataToApi = (formData: any) => {
  const apiData = { ...formData };

  // 处理特殊字段转换
  if (apiData.datasource_type) {
    apiData.datasource_type = apiData.datasource_type.toUpperCase();
  }

  if (apiData.direction) {
    apiData.direction = apiData.direction.toUpperCase();
  }

  // 处理数组字段
  if (apiData.projects && Array.isArray(apiData.projects)) {
    apiData.projects = apiData.projects.join(",");
  }

  if (apiData.products && Array.isArray(apiData.products)) {
    apiData.products = apiData.products.join(",");
  }

  if (apiData.customers && Array.isArray(apiData.customers)) {
    apiData.customers = apiData.customers.join(",");
  }

  return apiData;
};

/**
 * 转换API数据到表单数据
 * @param apiData API数据
 * @returns 表单数据
 */
export const transformApiDataToForm = (apiData: any) => {
  const formData = { ...apiData };

  // 处理字符串字段转换为数组
  if (formData.projects && typeof formData.projects === "string") {
    formData.projects = formData.projects.split(",").filter(Boolean);
  }

  if (formData.products && typeof formData.products === "string") {
    formData.products = formData.products.split(",").filter(Boolean);
  }

  if (formData.customers && typeof formData.customers === "string") {
    formData.customers = formData.customers.split(",").filter(Boolean);
  }

  return formData;
};

/**
 * 构建查询URL参数
 * @param params 查询参数
 * @returns URL参数字符串
 */
export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(","));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString();
};

/**
 * 解析URL查询参数
 * @param search URL查询字符串
 * @returns 解析后的参数对象
 */
export const parseQueryParams = (search: string): Record<string, any> => {
  const params: Record<string, any> = {};
  const searchParams = new URLSearchParams(search);

  searchParams.forEach((value, key) => {
    // 尝试解析为数字
    if (!isNaN(Number(value))) {
      params[key] = Number(value);
    }
    // 尝试解析为布尔值
    else if (value === "true" || value === "false") {
      params[key] = value === "true";
    }
    // 尝试解析为数组（逗号分隔）
    else if (value.includes(",")) {
      params[key] = value.split(",").filter(Boolean);
    }
    // 默认为字符串
    else {
      params[key] = value;
    }
  });

  return params;
};
