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

// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You obtain a copy of the License at
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
import {
  createTableRequestWithResponseHandler,
  type StandardApiResponse,
} from '@veaiops/utils';
import type { DataSource, DataSourceType } from 'api-generate';

/**
 * 根据数据源类型获取数据请求函数
 *
 * @param dataSourceType - 数据源类型
 * @returns 数据请求函数
 */
export const createMonitorTableRequest = (
  dataSourceType: DataSourceType,
) => {
  return createTableRequestWithResponseHandler({
    apiCall: async ({ skip, limit }): Promise<StandardApiResponse<DataSource[]>> => {
      let response;
      switch (dataSourceType) {
        case 'Zabbix':
          response = await apiClient.dataSources.getApisV1DatasourceZabbix({
            skip,
            limit,
          });
          break;
        case 'Aliyun':
          response = await apiClient.dataSources.getApisV1DatasourceAliyun({
            skip,
            limit,
          });
          break;
        case 'Volcengine':
          response = await apiClient.dataSources.getApisV1DatasourceVolcengine({
            skip,
            limit,
          });
          break;
        default:
          throw new Error(`Unsupported data source type: ${dataSourceType}`);
      }
      // 注意：使用类型断言将 API 响应转换为 StandardApiResponse 格式
      // TODO: 完善 API 类型定义，统一响应格式
      return response as unknown as StandardApiResponse<DataSource[]>;
    },
    options: {
      errorMessagePrefix: '加载数据源列表失败',
      defaultLimit: 10,
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : '加载数据源列表失败，请重试';
        Message.error(errorMessage);
      },
    },
  });
};
