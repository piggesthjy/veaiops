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
import type { APIResponseSubscribeRelation } from '../models/api-response-subscribe-relation';
import type { EventLevel } from '../models/event-level';
import type { PaginatedAPIResponseSubscribeRelationList } from '../models/paginated-api-response-subscribe-relation-list';
import type { SubscribeRelationCreate } from '../models/subscribe-relation-create';
import type { SubscribeRelationUpdate } from '../models/subscribe-relation-update';
import type { ToggleActiveRequest } from '../models/toggle-active-request';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class SubscribeService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get Subscribes
   * Get all subscribes with optional pagination and filtering
   * @returns PaginatedAPIResponseSubscribeRelationList Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerEventCenterSubscribe({
    skip,
    limit = 100,
    name,
    agents,
    eventLevels,
    enableWebhook,
    products,
    projects,
    customers,
    showAll,
  }: {
    skip?: number,
    limit?: number,
    /**
     * Subscribe name
     */
    name?: string,
    /**
     * Subscribe agents
     */
    agents?: Array<string>,
    /**
     * Event levels
     */
    eventLevels?: Array<EventLevel>,
    /**
     * If Enable webhook
     */
    enableWebhook?: boolean,
    /**
     * Interest products
     */
    products?: Array<string>,
    /**
     * Interest projects
     */
    projects?: Array<string>,
    /**
     * Interest customers
     */
    customers?: Array<string>,
    /**
     * Weather Show disabled items
     */
    showAll?: boolean,
  }): CancelablePromise<PaginatedAPIResponseSubscribeRelationList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/event-center/subscribe/',
      query: {
        'skip': skip,
        'limit': limit,
        'name': name,
        'agents': agents,
        'event_levels': eventLevels,
        'enable_webhook': enableWebhook,
        'products': products,
        'projects': projects,
        'customers': customers,
        'show_all': showAll,
      },
    });
  }
  /**
   * Create Subscribe
   * Create a new subscribe
   * @returns APIResponseSubscribeRelation Created Successfully
   * @throws ApiError
   */
  public postApisV1ManagerEventCenterSubscribe({
    requestBody,
  }: {
    requestBody: SubscribeRelationCreate,
  }): CancelablePromise<APIResponseSubscribeRelation> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/event-center/subscribe/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Get Subscribe
   * Get a subscribe by ID
   * @returns APIResponseSubscribeRelation Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerEventCenterSubscribe1({
    uid,
  }: {
    uid: string,
  }): CancelablePromise<APIResponseSubscribeRelation> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/event-center/subscribe/{uid}',
      path: {
        'uid': uid,
      },
    });
  }
  /**
   * Update Subscribe
   * Update a subscribe
   * @returns APIResponseSubscribeRelation Updated Successfully
   * @throws ApiError
   */
  public putApisV1ManagerEventCenterSubscribe({
    uid,
    requestBody,
  }: {
    uid: string,
    requestBody: SubscribeRelationUpdate,
  }): CancelablePromise<APIResponseSubscribeRelation> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/event-center/subscribe/{uid}',
      path: {
        'uid': uid,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Delete Subscribe
   * Delete a subscribe
   * @returns APIResponse Deleted Successfully
   * @throws ApiError
   */
  public deleteApisV1ManagerEventCenterSubscribe({
    uid,
  }: {
    uid: string,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/event-center/subscribe/{uid}',
      path: {
        'uid': uid,
      },
    });
  }
  /**
   * Toggle Subscribe
   * Enable or disable a subscribe
   * @returns APIResponseSubscribeRelation Toggle Successfully
   * @throws ApiError
   */
  public putApisV1ManagerEventCenterSubscribeToggle({
    uid,
    requestBody,
  }: {
    uid: string,
    requestBody: ToggleActiveRequest,
  }): CancelablePromise<APIResponseSubscribeRelation> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/event-center/subscribe/{uid}/toggle',
      path: {
        'uid': uid,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
