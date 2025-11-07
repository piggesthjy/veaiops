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
import type { APIResponseBoolean } from '../models/api-response-boolean';
import type { APIResponseOncallSchedule } from '../models/api-response-oncall-schedule';
import type { OncallScheduleCreateRequest } from '../models/oncall-schedule-create-request';
import type { OncallScheduleUpdateRequest } from '../models/oncall-schedule-update-request';
import type { PaginatedAPIResponseOncallScheduleList } from '../models/paginated-api-response-oncall-schedule-list';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class OncallScheduleService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Create Oncall Schedule
   * Create a new oncall schedule for a specific rule
   * @returns APIResponseOncallSchedule Oncall schedule created successfully
   * @throws ApiError
   */
  public postApisV1ManagerRuleCenterOncallOncallSchedule({
    channel,
    botId,
    requestBody,
  }: {
    /**
     * Channel
     */
    channel: string,
    /**
     * App ID
     */
    botId: string,
    requestBody: OncallScheduleCreateRequest,
  }): CancelablePromise<APIResponseOncallSchedule> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/rule-center/oncall/{channel}/{bot_id}/oncall_schedule/',
      path: {
        'channel': channel,
        'bot_id': botId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Get Oncall Schedules
   * Get all oncall schedules for a specific rule
   * @returns PaginatedAPIResponseOncallScheduleList Oncall schedules retrieved successfully
   * @throws ApiError
   */
  public getApisV1ManagerRuleCenterOncallOncallSchedule({
    channel,
    botId,
    skip,
    limit = 100,
    startTime,
    endTime,
  }: {
    /**
     * Channel
     */
    channel: string,
    /**
     * App ID
     */
    botId: string,
    /**
     * Number of schedules to skip
     */
    skip?: number,
    /**
     * Maximum number of schedules to return
     */
    limit?: number,
    /**
     * Filter schedules from start time
     */
    startTime?: string,
    /**
     * Filter schedules to end time
     */
    endTime?: string,
  }): CancelablePromise<PaginatedAPIResponseOncallScheduleList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/rule-center/oncall/{channel}/{bot_id}/oncall_schedule/',
      path: {
        'channel': channel,
        'bot_id': botId,
      },
      query: {
        'skip': skip,
        'limit': limit,
        'start_time': startTime,
        'end_time': endTime,
      },
    });
  }
  /**
   * Get Oncall Schedule
   * Get an oncall schedule by ID
   * @returns APIResponseOncallSchedule Oncall schedule retrieved successfully
   * @throws ApiError
   */
  public getApisV1ManagerRuleCenterOncallOncallSchedule1({
    scheduleId,
  }: {
    /**
     * Schedule ID
     */
    scheduleId: string,
  }): CancelablePromise<APIResponseOncallSchedule> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/rule-center/oncall/oncall_schedule/{schedule_id}',
      path: {
        'schedule_id': scheduleId,
      },
    });
  }
  /**
   * Update Oncall Schedule
   * Update an oncall schedule
   * @returns APIResponseOncallSchedule Oncall schedule updated successfully
   * @throws ApiError
   */
  public putApisV1ManagerRuleCenterOncallOncallSchedule({
    scheduleId,
    requestBody,
  }: {
    /**
     * Schedule ID
     */
    scheduleId: string,
    requestBody: OncallScheduleUpdateRequest,
  }): CancelablePromise<APIResponseOncallSchedule> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/rule-center/oncall/oncall_schedule/{schedule_id}',
      path: {
        'schedule_id': scheduleId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Delete Oncall Schedule
   * Delete an oncall schedule
   * @returns APIResponseBoolean Oncall schedule deleted successfully
   * @throws ApiError
   */
  public deleteApisV1ManagerRuleCenterOncallOncallSchedule({
    scheduleId,
  }: {
    /**
     * Schedule ID
     */
    scheduleId: string,
  }): CancelablePromise<APIResponseBoolean> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/rule-center/oncall/oncall_schedule/{schedule_id}',
      path: {
        'schedule_id': scheduleId,
      },
    });
  }
}
