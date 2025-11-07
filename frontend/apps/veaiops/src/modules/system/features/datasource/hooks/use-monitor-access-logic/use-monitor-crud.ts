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

import apiClient from '@/utils/api-client';
import { Message } from '@arco-design/web-react';
import type { DataSource, DataSourceType } from '@datasource/lib';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { useCallback } from 'react';

/**
 * 监控数据源CRUD操作Hook
 * 提供数据源的创建、更新、删除操作
 */
export const useMonitorCrud = () => {
  /**
   * 创建监控配置
   * @returns Promise<boolean> - true表示成功，false表示失败
   */
  const createMonitor = useCallback(
    async (monitorData: Partial<DataSource>): Promise<boolean> => {
      try {
        const dataSourceType = monitorData.type;
        let response;

        // 生成连接名称（基于名称和时间戳）
        const connectName = `${monitorData.name || 'datasource'}_${Date.now()}`;

        switch (dataSourceType) {
          case 'Zabbix': {
            const requestBody = {
              name: monitorData.name || '',
              connect_name: connectName,
              targets: [],
              metric_name: '',
              history_type: 0,
              trigger_tags: [],
            };
            response = await apiClient.dataSources.postApisV1DatasourceZabbix({
              requestBody,
            });
            break;
          }
          case 'Aliyun': {
            const requestBody = {
              name: monitorData.name || '',
              connect_name: connectName,
              region: '',
              namespace: '',
              metric_name: '',
            };
            response = await apiClient.dataSources.postApisV1DatasourceAliyun({
              requestBody,
            });
            break;
          }
          case 'Volcengine': {
            const requestBody = {
              name: monitorData.name || '',
              connect_name: connectName,
              region: '',
              namespace: '',
              metric_name: '',
            };
            response =
              await apiClient.dataSources.postApisV1DatasourceVolcengine({
                requestBody,
              });
            break;
          }
          default:
            throw new Error(`不支持的数据源类型: ${dataSourceType}`);
        }

        if (response.code === API_RESPONSE_CODE.SUCCESS) {
          Message.success('监控数据源创建成功');
          return true;
        }

        throw new Error(response.message || '创建监控数据源失败');
      } catch (error: unknown) {
        // ✅ 正确：优化错误消息处理，提取关键信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        let errorMessage = errorObj.message || '创建监控数据源失败';

        // ✅ 处理常见的 4xx 客户端错误
        if (
          errorMessage.includes('duplicate key') ||
          errorMessage.includes('E11000')
        ) {
          // 409 Conflict - 重复键错误
          const nameMatch = errorMessage.match(/name.*?:\s*"([^"]+)"/);
          if (nameMatch?.[1]) {
            errorMessage = `数据源名称 "${nameMatch[1]}" 已存在，请使用其他名称`;
          } else {
            errorMessage = '数据源名称已存在，请使用其他名称';
          }
        } else if (errorMessage.includes('Conflict')) {
          // 409 Conflict - 通用冲突错误
          errorMessage = '数据源已存在，请检查输入信息';
        } else if (errorMessage.includes('Bad Request')) {
          // 400 Bad Request - 请求参数错误
          errorMessage = '请求参数错误，请检查输入信息';
        } else if (errorMessage.includes('Unauthorized')) {
          // 401 Unauthorized - 未授权
          errorMessage = '未授权，请重新登录';
        } else if (errorMessage.includes('Forbidden')) {
          // 403 Forbidden - 权限不足
          errorMessage = '权限不足，无法执行此操作';
        } else if (errorMessage.includes('Not Found')) {
          // 404 Not Found - 资源不存在
          errorMessage = '连接配置不存在，请先创建连接';
        } else if (errorMessage.includes('Method Not Allowed')) {
          // 405 Method Not Allowed
          errorMessage = '操作方法不被允许';
        } else if (errorMessage.includes('Request Timeout')) {
          // 408 Request Timeout
          errorMessage = '请求超时，请重试';
        } else if (errorMessage.includes('Unprocessable Entity')) {
          // 422 Unprocessable Entity - 实体无法处理
          errorMessage = '数据格式错误，请检查输入信息';
        } else if (errorMessage.includes('Too Many Requests')) {
          // 429 Too Many Requests
          errorMessage = '请求过于频繁，请稍后再试';
        }

        Message.error(errorMessage);
        return false;
      }
    },
    [],
  );

  /**
   * 更新监控配置
   * @returns Promise<boolean> - true表示成功，false表示失败
   */
  const updateMonitor = useCallback(
    async (
      monitorId: string,
      updateData: Partial<DataSource>,
      datasourceType: DataSourceType,
    ): Promise<boolean> => {
      try {
        let response;

        // 注意：使用 as any 是因为 updateData 的结构与 API 生成的请求体类型不完全匹配
        // TODO: 完善 API 类型定义或创建类型适配器函数
        switch (datasourceType) {
          case 'Zabbix':
            response = await apiClient.dataSources.putApisV1DatasourceZabbix({
              datasourceId: monitorId,
              requestBody: updateData as any,
            });
            break;
          case 'Aliyun':
            response = await apiClient.dataSources.putApisV1DatasourceAliyun({
              datasourceId: monitorId,
              requestBody: updateData as any,
            });
            break;
          case 'Volcengine':
            response =
              await apiClient.dataSources.putApisV1DatasourceVolcengineDatasourceId(
                {
                  datasourceId: monitorId,
                  requestBody: updateData as any,
                },
              );
            break;
          default:
            throw new Error(`不支持的数据源类型: ${datasourceType}`);
        }

        if (response.code === API_RESPONSE_CODE.SUCCESS) {
          Message.success('监控数据源更新成功');
          return true;
        }

        throw new Error(response.message || '更新监控数据源失败');
      } catch (error: unknown) {
        // ✅ 正确：优化错误消息处理
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        let errorMessage = errorObj.message || '更新监控数据源失败';

        // ✅ 处理常见的 4xx 客户端错误
        if (errorMessage.includes('Not Found')) {
          errorMessage = '数据源不存在，无法更新';
        } else if (errorMessage.includes('Forbidden')) {
          errorMessage = '权限不足，无法更新数据源';
        } else if (errorMessage.includes('Bad Request')) {
          errorMessage = '请求参数错误，请检查输入信息';
        } else if (errorMessage.includes('Unprocessable Entity')) {
          errorMessage = '数据格式错误，请检查输入信息';
        }

        Message.error(errorMessage);
        return false;
      }
    },
    [],
  );

  /**
   * 删除监控配置
   * @returns Promise<boolean> - true表示成功，false表示失败
   */
  const deleteMonitor = useCallback(
    async (
      monitorId: string,
      datasourceType: DataSourceType,
    ): Promise<boolean> => {
      try {
        let response;

        switch (datasourceType) {
          case 'Zabbix':
            response = await apiClient.dataSources.deleteApisV1DatasourceZabbix(
              {
                datasourceId: monitorId,
              },
            );
            break;
          case 'Aliyun':
            response = await apiClient.dataSources.deleteApisV1DatasourceAliyun(
              {
                datasourceId: monitorId,
              },
            );
            break;
          case 'Volcengine':
            response =
              await apiClient.dataSources.deleteApisV1DatasourceVolcengineDatasourceId(
                {
                  datasourceId: monitorId,
                },
              );
            break;
          default:
            throw new Error(`不支持的数据源类型: ${datasourceType}`);
        }

        if (response.code === API_RESPONSE_CODE.SUCCESS) {
          Message.success('监控数据源删除成功');
          return true;
        }

        throw new Error(response.message || '删除监控数据源失败');
      } catch (error: unknown) {
        // ✅ 正确：优化错误消息处理
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        let errorMessage = errorObj.message || '删除监控数据源失败';

        // ✅ 处理常见的 4xx 客户端错误
        if (errorMessage.includes('Not Found')) {
          errorMessage = '数据源不存在，无法删除';
        } else if (errorMessage.includes('Forbidden')) {
          errorMessage = '权限不足，无法删除数据源';
        } else if (errorMessage.includes('Conflict')) {
          errorMessage = '数据源正在使用中，无法删除';
        }

        Message.error(errorMessage);
        return false;
      }
    },
    [],
  );

  return {
    createMonitor,
    updateMonitor,
    deleteMonitor,
  };
};
