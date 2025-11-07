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
 * 监控数据源管理API服务
 */

import type { APIResponseDataSourceList, DataSource } from "api-generate";
import type { DataSourceType } from "./types";
import apiClient from "@/utils/api-client";

/**
 * 数据源API服务
 */
export const DataSourceApiService = {
  /**
   * 获取Zabbix数据源列表
   */
  async getZabbixDataSources(): Promise<APIResponseDataSourceList> {
    const response = await apiClient.dataSources.getApisV1DatasourceZabbix({
      skip: 0,
      limit: 1000,
    });
    return response;
  },

  /**
   * 获取阿里云数据源列表
   */
  async getAliyunDataSources(): Promise<APIResponseDataSourceList> {
    const response = await apiClient.dataSources.getApisV1DatasourceAliyun({
      skip: 0,
      limit: 1000,
    });
    return response;
  },

  /**
   * 获取火山引擎数据源列表
   */
  async getVolcengineDataSources(): Promise<APIResponseDataSourceList> {
    const response = await apiClient.dataSources.getApisV1DatasourceVolcengine({
      skip: 0,
      limit: 1000,
    });
    return response;
  },

  /**
   * 删除Zabbix数据源
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async deleteZabbixDataSource(
    id: string,
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await apiClient.dataSources.deleteApisV1DatasourceZabbix({
        datasourceId: id,
      });
      return { success: true };
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      return { success: false, error: errorObj };
    }
  },

  /**
   * 删除阿里云数据源
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async deleteAliyunDataSource(
    id: string,
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await apiClient.dataSources.deleteApisV1DatasourceAliyun({
        datasourceId: id,
      });
      return { success: true };
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      return { success: false, error: errorObj };
    }
  },

  /**
   * 删除火山引擎数据源
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async deleteVolcengineDataSource(
    id: string,
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await apiClient.dataSources.deleteApisV1DatasourceVolcengineDatasourceId({
        datasourceId: id,
      });
      return { success: true };
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      return { success: false, error: errorObj };
    }
  },

  /**
   * 根据类型删除数据源
   *
   * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
   */
  async deleteDataSourceByType(
    type: DataSourceType,
    id: string,
  ): Promise<{ success: boolean; error?: Error }> {
    switch (type) {
      case 'Zabbix':
        return this.deleteZabbixDataSource(id);
      case 'Aliyun':
        return this.deleteAliyunDataSource(id);
      case 'Volcengine':
        return this.deleteVolcengineDataSource(id);
      default: {
        const errorObj = new Error(`不支持的数据源类型: ${type}`);
        return { success: false, error: errorObj };
      }
    }
  },

  /**
   * 根据类型获取数据源列表
   */
  async getDataSourcesByType(type: DataSourceType): Promise<DataSource[]> {
    switch (type) {
      case "Zabbix": {
        const response = await this.getZabbixDataSources();
        return response.data || [];
      }
      case "Aliyun": {
        const response = await this.getAliyunDataSources();
        return response.data || [];
      }
      case "Volcengine": {
        const response = await this.getVolcengineDataSources();
        return response.data || [];
      }
      default:
        throw new Error(`不支持的数据源类型: ${type}`);
    }
  },
};
