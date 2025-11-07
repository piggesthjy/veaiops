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

import type {
  MetricTemplateCreateRequest,
  MetricTemplateUpdateRequest,
  ToggleActiveRequest,
} from "api-generate";
import apiClient from "@/utils/api-client";

/**
 * 指标模板相关的API封装
 */
interface UpdateParams {
  uid: string;
  data: MetricTemplateUpdateRequest;
}

interface ToggleParams {
  uid: string;
  data: ToggleActiveRequest;
}

export const metricTemplateApi = {
  /**
   * 获取指标模板列表
   * @param params 查询参数
   */
  list: (params?: { skip?: number; limit?: number }) => {
    return apiClient.metricTemplate.getApisV1DatasourceTemplate(params || {});
  },

  /**
   * 创建指标模板
   * @param data 创建参数
   */
  create: (data: MetricTemplateCreateRequest) => {
    return apiClient.metricTemplate.postApisV1DatasourceTemplate({
      requestBody: data,
    });
  },

  /**
   * 获取单个指标模板
   * @param uid 模板唯一标识符
   */
  get: (uid: string) => {
    return apiClient.metricTemplate.getApisV1DatasourceTemplate1({
      uid,
    });
  },

  /**
   * 更新指标模板
   */
  update: ({ uid, data }: UpdateParams) => {
    return apiClient.metricTemplate.putApisV1DatasourceTemplate({
      uid,
      requestBody: data,
    });
  },

  /**
   * 删除指标模板
   * @param uid 模板唯一标识符
   */
  delete: (uid: string) => {
    return apiClient.metricTemplate.deleteApisV1DatasourceTemplate({
      uid,
    });
  },

  /**
   * 切换指标模板激活状态
   */
  toggle: ({ uid, data }: ToggleParams) => {
    return apiClient.metricTemplate.putApisV1DatasourceTemplateToggle({
      uid,
      requestBody: data,
    });
  },
};

export default metricTemplateApi;
