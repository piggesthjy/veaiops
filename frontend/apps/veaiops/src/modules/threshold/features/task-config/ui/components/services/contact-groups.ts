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
import { API_RESPONSE_CODE } from '@veaiops/constants';
import type { ContactGroup } from '../shared/types';

/**
 * 获取火山引擎联系组
 *
 * @param datasourceId - 数据源ID
 * @returns Promise<ContactGroup[]>
 */
export const fetchVolcengineContactGroups = async (
  datasourceId: string,
): Promise<ContactGroup[]> => {
  try {
    // 使用生成的 API 方法调用后端接口
    const response =
      await apiClient.dataSources.getApisV1DatasourceVolcengineContactGroups({
        datasourceId,
        skip: 0,
        limit: 100,
      });

    const contactGroupsData = response.data as ContactGroup[] | undefined;

    if (response.code === API_RESPONSE_CODE.SUCCESS && contactGroupsData) {
      return contactGroupsData;
    } else {
      const error = response.message || '获取联系组失败';

      throw new Error(error);
    }
  } catch (error) {
    // ✅ 正确：透出实际的错误信息
    const errorObj = error instanceof Error ? error : new Error(String(error));
    throw new Error(
      errorObj instanceof Error
        ? errorObj.message
        : '获取火山引擎联系组失败，请稍后重试',
    );
  }
};

/**
 * 获取阿里云联系组
 *
 * @param datasourceId - 数据源ID
 * @returns Promise<ContactGroup[]>
 */
export const fetchAliyunContactGroups = async (
  datasourceId: string,
): Promise<ContactGroup[]> => {
  try {
    // 步骤1: 获取DataSource详情以获得connect_id

    const datasourceResponse =
      await apiClient.dataSources.getApisV1DatasourceAliyun1({
        datasourceId,
      });

    if (datasourceResponse.code !== API_RESPONSE_CODE.SUCCESS) {
      const error = datasourceResponse.message || '获取数据源信息失败';

      throw new Error(error);
    }

    if (!datasourceResponse.data) {
      throw new Error('数据源信息为空');
    }

    const dataSourceData: any = datasourceResponse.data;

    // 步骤2: 从DataSource中获取connect的ID
    const connectId = dataSourceData.connect?._id || dataSourceData.connect;

    if (!connectId) {
      throw new Error('数据源未配置连接信息');
    }

    // 步骤3: 使用connect_id调用Aliyun的contact groups API
    // 后端接口：POST /apis/v1/datasource/connect/aliyun/{connect_id}/describe-contact-group-list
    const response: any = await apiClient.request.request({
      method: 'POST',
      url: `/apis/v1/datasource/connect/aliyun/${connectId}/describe-contact-group-list`,
      query: {
        skip: 0,
        limit: 100,
      },
    });

    if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
      return response.data as ContactGroup[];
    } else {
      const error = response.message || '获取联系组失败';

      throw new Error(error);
    }
  } catch (error) {
    // ✅ 正确：透出实际的错误信息
    const errorObj = error instanceof Error ? error : new Error(String(error));
    throw new Error(
      errorObj instanceof Error
        ? errorObj.message
        : '获取阿里云联系组失败，请稍后重试',
    );
  }
};

/**
 * 根据数据源类型获取联系组
 *
 * @param datasourceType - 数据源类型 (Volcengine|Aliyun|Zabbix)
 * @param datasourceId - 数据源ID
 * @returns Promise<ContactGroup[]>
 */
export const fetchContactGroups = async (
  datasourceType: string,
  datasourceId: string,
): Promise<ContactGroup[]> => {
  switch (datasourceType) {
    case 'Volcengine':
      return fetchVolcengineContactGroups(datasourceId);
    case 'Aliyun':
      return fetchAliyunContactGroups(datasourceId);
    default:
      return [];
  }
};
