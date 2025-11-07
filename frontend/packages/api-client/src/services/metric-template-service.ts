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
import type { APIResponse } from '../models/api-response';
import type { APIResponseMetricTemplate } from '../models/api-response-metric-template';
import type { APIResponseMetricTemplateList } from '../models/api-response-metric-template-list';
import type { MetricTemplateCreateRequest } from '../models/metric-template-create-request';
import type { MetricTemplateUpdateRequest } from '../models/metric-template-update-request';
import type { ToggleActiveRequest } from '../models/toggle-active-request';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class MetricTemplateService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get All Metric Templates
   * Get all metric templates with optional pagination
   * @returns APIResponseMetricTemplateList Successful Response
   * @throws ApiError
   */
  public getApisV1DatasourceTemplate({
    skip,
    limit = 100,
  }: {
    /**
     * Number of templates to skip
     */
    skip?: number,
    /**
     * Maximum number of templates to return
     */
    limit?: number,
  }): CancelablePromise<APIResponseMetricTemplateList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/datasource/template/',
      query: {
        'skip': skip,
        'limit': limit,
      },
    });
  }
  /**
   * Create Metric Template
   * Create a new metric template
   * @returns APIResponse Created Successfully
   * @throws ApiError
   */
  public postApisV1DatasourceTemplate({
    requestBody,
  }: {
    requestBody: MetricTemplateCreateRequest,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/datasource/template/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Get Metric Template
   * Get a metric template by ID
   * @returns APIResponseMetricTemplate Successful Response
   * @throws ApiError
   */
  public getApisV1DatasourceTemplate1({
    uid,
  }: {
    /**
     * Template unique identifier
     */
    uid: string,
  }): CancelablePromise<APIResponseMetricTemplate> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/datasource/template/{uid}',
      path: {
        'uid': uid,
      },
    });
  }
  /**
   * Update Metric Template
   * Update a metric template
   * @returns APIResponse Updated Successfully
   * @throws ApiError
   */
  public putApisV1DatasourceTemplate({
    uid,
    requestBody,
  }: {
    /**
     * Template unique identifier
     */
    uid: string,
    requestBody: MetricTemplateUpdateRequest,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/datasource/template/{uid}',
      path: {
        'uid': uid,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Delete Metric Template
   * Delete a metric template (soft delete)
   * @returns APIResponse Deleted Successfully
   * @throws ApiError
   */
  public deleteApisV1DatasourceTemplate({
    uid,
  }: {
    /**
     * Template unique identifier
     */
    uid: string,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/datasource/template/{uid}',
      path: {
        'uid': uid,
      },
    });
  }
  /**
   * Toggle Template Active Status
   * Active or disable a metric template
   * @returns APIResponseMetricTemplate Toggle Successfully
   * @throws ApiError
   */
  public putApisV1DatasourceTemplateToggle({
    uid,
    requestBody,
  }: {
    /**
     * Template unique identifier
     */
    uid: string,
    requestBody: ToggleActiveRequest,
  }): CancelablePromise<APIResponseMetricTemplate> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/datasource/template/{uid}/toggle',
      path: {
        'uid': uid,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
