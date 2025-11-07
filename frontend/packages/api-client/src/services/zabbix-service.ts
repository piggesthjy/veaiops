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

/* generated using openapi-typescript-codegen -- do not edit */
import type { APIResponseDataSource } from '../models/api-response-data-source';
import type { APIResponseZabbixItemList } from '../models/api-response-zabbix-item-list';
import type { ZabbixDataSourceConfig } from '../models/zabbix-data-source-config';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class ZabbixService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get Zabbix items by host and metric
   * @returns APIResponseZabbixItemList Successful response
   * @throws ApiError
   */
  public getZabbixItems({
    connectName,
    host,
    metricName,
  }: {
    /**
     * Connect name
     */
    connectName: string,
    /**
     * Host name
     */
    host: string,
    /**
     * Metric name
     */
    metricName: string,
  }): CancelablePromise<APIResponseZabbixItemList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/datasource/zabbix/{connect_name}/items',
      path: {
        'connect_name': connectName,
      },
      query: {
        'host': host,
        'metric_name': metricName,
      },
    });
  }
  /**
   * Create Zabbix data source
   * @returns APIResponseDataSource Successful response
   * @throws ApiError
   */
  public createZabbixDataSource({
    requestBody,
  }: {
    requestBody: ZabbixDataSourceConfig,
  }): CancelablePromise<APIResponseDataSource> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/datasource/zabbix',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
