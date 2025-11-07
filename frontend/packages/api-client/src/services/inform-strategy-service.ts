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
import type { APIResponseInformStrategy } from '../models/api-response-inform-strategy';
import type { ChannelType } from '../models/channel-type';
import type { InformStrategyCreate } from '../models/inform-strategy-create';
import type { InformStrategyUpdate } from '../models/inform-strategy-update';
import type { PaginatedAPIResponseInformStrategyList } from '../models/paginated-api-response-inform-strategy-list';
import type { ToggleActiveRequest } from '../models/toggle-active-request';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class InformStrategyService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get All Inform Strategies
   * Get all inform strategies with optional pagination and filtering
   * @returns PaginatedAPIResponseInformStrategyList Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerEventCenterInformStrategy({
    name,
    channel,
    botId,
    showAll,
    skip,
    limit = 100,
  }: {
    /**
     * Strategy name filter
     */
    name?: string,
    /**
     * Channel type filter
     */
    channel?: ChannelType,
    /**
     * App ID filter
     */
    botId?: string,
    /**
     * Whether to show disabled items
     */
    showAll?: boolean,
    /**
     * Number of inform strategies to skip
     */
    skip?: number,
    /**
     * Maximum number of inform strategies to return
     */
    limit?: number,
  }): CancelablePromise<PaginatedAPIResponseInformStrategyList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/event-center/inform-strategy/',
      query: {
        'name': name,
        'channel': channel,
        'bot_id': botId,
        'show_all': showAll,
        'skip': skip,
        'limit': limit,
      },
    });
  }
  /**
   * Create Inform Strategy
   * Create a new inform strategy
   * @returns APIResponseInformStrategy Created Successfully
   * @throws ApiError
   */
  public postApisV1ManagerEventCenterInformStrategy({
    requestBody,
  }: {
    requestBody: InformStrategyCreate,
  }): CancelablePromise<APIResponseInformStrategy> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/event-center/inform-strategy/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Get Inform Strategy
   * Get an inform strategy by ID
   * @returns APIResponseInformStrategy Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerEventCenterInformStrategy1({
    uid,
  }: {
    /**
     * Inform strategy unique identifier
     */
    uid: string,
  }): CancelablePromise<APIResponseInformStrategy> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/event-center/inform-strategy/{uid}',
      path: {
        'uid': uid,
      },
    });
  }
  /**
   * Update Inform Strategy
   * Update an inform strategy
   * @returns APIResponseInformStrategy Updated Successfully
   * @throws ApiError
   */
  public putApisV1ManagerEventCenterInformStrategy({
    uid,
    requestBody,
  }: {
    /**
     * Inform strategy unique identifier
     */
    uid: string,
    requestBody: InformStrategyUpdate,
  }): CancelablePromise<APIResponseInformStrategy> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/event-center/inform-strategy/{uid}',
      path: {
        'uid': uid,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Delete Inform Strategy
   * Delete an inform strategy
   * @returns APIResponse Deleted Successfully
   * @throws ApiError
   */
  public deleteApisV1ManagerEventCenterInformStrategy({
    uid,
  }: {
    /**
     * Inform strategy unique identifier
     */
    uid: string,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/event-center/inform-strategy/{uid}',
      path: {
        'uid': uid,
      },
    });
  }
  /**
   * Toggle Inform Strategy Active Status
   * Enable or disable an inform strategy
   * @returns APIResponseInformStrategy Toggle Successfully
   * @throws ApiError
   */
  public putApisV1ManagerEventCenterInformStrategyToggle({
    uid,
    requestBody,
  }: {
    /**
     * Inform strategy unique identifier
     */
    uid: string,
    requestBody: ToggleActiveRequest,
  }): CancelablePromise<APIResponseInformStrategy> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/event-center/inform-strategy/{uid}/toggle',
      path: {
        'uid': uid,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
