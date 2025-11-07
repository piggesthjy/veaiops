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

import { Message } from '@arco-design/web-react';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import type {
  APIResponse,
  APIResponseIntelligentThresholdTask,
  APIResponseMetricTemplate,
  MetricTemplateCreateRequest,
  MetricTemplateUpdateRequest,
  PaginatedAPIResponseMetricTemplateList,
} from 'api-generate';
import apiClient from './api-client';

/**
 * 更新指标模板的参数接口
 */
interface UpdateTemplateParams {
  templateId: string;
  request: MetricTemplateUpdateRequest;
}

/**
 * 智能阈值任务管理API
 */
export const IntelligentThresholdTaskAPI = {
  /**
   * 创建智能阈值任务
   */
  async createTask(request: any): Promise<APIResponseIntelligentThresholdTask> {
    try {
      const response =
        await apiClient.intelligentThresholdTask.postApisV1IntelligentThresholdTask(
          {
            requestBody: request,
          },
        );

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        Message.success('智能阈值任务创建成功');
        return response;
      } else {
        throw new Error(response.message || '创建智能阈值任务失败');
      }
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      const errorMessage =
        error instanceof Error ? error.message : '创建智能阈值任务失败';

      Message.error(errorMessage);
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  },
} as const;

/**
 * 指标模板管理API
 */
export const MetricTemplateAPI = {
  /**
   * 获取指标模板列表
   */
  async listTemplates(params?: {
    skip?: number;
    limit?: number;
    name?: string;
  }): Promise<PaginatedAPIResponseMetricTemplateList> {
    try {
      const response =
        await apiClient.metricTemplate.getApisV1DatasourceTemplate({
          skip: params?.skip || 0,
          limit: params?.limit || 100,
        });

      if (response.code === API_RESPONSE_CODE.SUCCESS) {
        return response;
      } else {
        throw new Error(response.message || '获取指标模板列表失败');
      }
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      const errorMessage =
        error instanceof Error ? error.message : '获取指标模板列表失败';

      Message.error(errorMessage);
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  },

  /**
   * 创建指标模板
   */
  async createTemplate(
    request: MetricTemplateCreateRequest,
  ): Promise<APIResponseMetricTemplate> {
    try {
      const response =
        await apiClient.metricTemplate.postApisV1DatasourceTemplate({
          requestBody: request,
        });

      if (response.code === API_RESPONSE_CODE.SUCCESS) {
        Message.success('指标模板创建成功');
        return response as APIResponseMetricTemplate;
      } else {
        throw new Error(response.message || '创建指标模板失败');
      }
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      const errorMessage =
        error instanceof Error ? error.message : '创建指标模板失败';

      Message.error(errorMessage);
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  },

  /**
   * 获取指标模板详情
   */
  async getTemplate(templateId: string): Promise<APIResponseMetricTemplate> {
    try {
      const response =
        await apiClient.metricTemplate.getApisV1DatasourceTemplate1({
          uid: templateId,
        });

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        return response;
      } else {
        throw new Error(response.message || '获取指标模板详情失败');
      }
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      const errorMessage =
        error instanceof Error ? error.message : '获取指标模板详情失败';

      Message.error(errorMessage);
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  },

  /**
   * 更新指标模板
   */
  async updateTemplate({
    templateId,
    request,
  }: UpdateTemplateParams): Promise<APIResponseMetricTemplate> {
    try {
      const response =
        await apiClient.metricTemplate.putApisV1DatasourceTemplate({
          uid: templateId,
          requestBody: request,
        });

      if (response.code === API_RESPONSE_CODE.SUCCESS) {
        Message.success('指标模板更新成功');
        return response as APIResponseMetricTemplate;
      } else {
        throw new Error(response.message || '更新指标模板失败');
      }
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      const errorMessage =
        error instanceof Error ? error.message : '更新指标模板失败';

      Message.error(errorMessage);
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  },

  /**
   * 删除指标模板
   */
  async deleteTemplate(templateId: string): Promise<APIResponse> {
    try {
      const response =
        await apiClient.metricTemplate.deleteApisV1DatasourceTemplate({
          uid: templateId,
        });

      if (response.code === API_RESPONSE_CODE.SUCCESS) {
        Message.success('指标模板删除成功');
        return response;
      } else {
        throw new Error(response.message || '删除指标模板失败');
      }
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      const errorMessage =
        error instanceof Error ? error.message : '删除指标模板失败';

      Message.error(errorMessage);
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  },
} as const;
