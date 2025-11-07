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
import type { APIResponseBoolean } from '../models/api-response-boolean';
import type { APIResponseBotAttribute } from '../models/api-response-bot-attribute';
import type { APIResponseBotAttributeList } from '../models/api-response-bot-attribute-list';
import type { AttributeKey } from '../models/attribute-key';
import type { BotAttributeCreateRequest } from '../models/bot-attribute-create-request';
import type { BotAttributePayload } from '../models/bot-attribute-payload';
import type { BotAttributeUpdateRequest } from '../models/bot-attribute-update-request';
import type { ChannelType } from '../models/channel-type';
import type { PaginatedAPIResponseBotAttributeList } from '../models/paginated-api-response-bot-attribute-list';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class BotAttributesService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get Bot Attributes
   * Get all bot attributes with optional pagination and filtering
   * @returns PaginatedAPIResponseBotAttributeList Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerSystemConfigBotAttributes({
    skip,
    limit = 10,
    names,
    value,
  }: {
    /**
     * Number of bot attributes to skip
     */
    skip?: number,
    /**
     * Maximum number of bot attributes to return
     */
    limit?: number,
    /**
     * Filter by attribute names
     */
    names?: Array<AttributeKey>,
    /**
     * Filter by attribute value (regex search)
     */
    value?: string,
  }): CancelablePromise<PaginatedAPIResponseBotAttributeList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/system-config/bot-attributes/',
      query: {
        'skip': skip,
        'limit': limit,
        'names': names,
        'value': value,
      },
    });
  }
  /**
   * Create Bot Attributes
   * Create new bot attributes in batch
   * @returns APIResponseBotAttributeList Created Successfully
   * @throws ApiError
   */
  public postApisV1ManagerSystemConfigBotAttributes({
    requestBody,
  }: {
    requestBody: BotAttributePayload,
  }): CancelablePromise<APIResponseBotAttributeList> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/system-config/bot-attributes/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Delete Bot Attributes
   * Delete multiple bot attributes by channel, bot_id and names
   * @returns APIResponse Deleted Successfully
   * @throws ApiError
   */
  public deleteApisV1ManagerSystemConfigBotAttributes({
    channel,
    botId,
    names,
  }: {
    channel: ChannelType,
    botId: string,
    names: Array<AttributeKey>,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/system-config/bot-attributes/',
      query: {
        'channel': channel,
        'bot_id': botId,
        'names': names,
      },
    });
  }
  /**
   * Get Bot Attribute
   * Get a bot attribute by ID
   * @returns APIResponseBotAttribute Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerSystemConfigBotAttributes1({
    botAttributeId,
  }: {
    botAttributeId: string,
  }): CancelablePromise<APIResponseBotAttribute> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/system-config/bot-attributes/{bot_attribute_id}',
      path: {
        'bot_attribute_id': botAttributeId,
      },
    });
  }
  /**
   * Update Bot Attribute
   * Update a bot attribute value
   * @returns APIResponseBotAttribute Updated Successfully
   * @throws ApiError
   */
  public putApisV1ManagerSystemConfigBotAttributes({
    botAttributeId,
    value,
  }: {
    botAttributeId: string,
    value: string,
  }): CancelablePromise<APIResponseBotAttribute> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/system-config/bot-attributes/{bot_attribute_id}',
      path: {
        'bot_attribute_id': botAttributeId,
      },
      query: {
        'value': value,
      },
    });
  }
  /**
   * Delete Bot Attribute
   * Delete a bot attribute by ID
   * @returns APIResponse Deleted Successfully
   * @throws ApiError
   */
  public deleteApisV1ManagerSystemConfigBotAttributes1({
    botAttributeId,
  }: {
    botAttributeId: string,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/system-config/bot-attributes/{bot_attribute_id}',
      path: {
        'bot_attribute_id': botAttributeId,
      },
    });
  }
  /**
   * Get All Bot Attributes
   * Get all bot attributes with optional pagination
   * @returns PaginatedAPIResponseBotAttributeList Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerSystemConfigBotAttributes2({
    skip,
    limit = 100,
  }: {
    /**
     * Number of bot attributes to skip
     */
    skip?: number,
    /**
     * Maximum number of bot attributes to return
     */
    limit?: number,
  }): CancelablePromise<PaginatedAPIResponseBotAttributeList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/system-config/bot_attributes/',
      query: {
        'skip': skip,
        'limit': limit,
      },
    });
  }
  /**
   * Create Bot Attribute
   * Create a new bot attribute
   * @returns APIResponseBotAttribute Created Successfully
   * @throws ApiError
   */
  public postApisV1ManagerSystemConfigBotAttributes1({
    requestBody,
  }: {
    requestBody: BotAttributeCreateRequest,
  }): CancelablePromise<APIResponseBotAttribute> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/system-config/bot_attributes/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Batch Delete Bot Attributes
   * Delete multiple bot attributes
   * @returns APIResponseBoolean Deleted Successfully
   * @throws ApiError
   */
  public deleteApisV1ManagerSystemConfigBotAttributes2({
    requestBody,
  }: {
    requestBody: {
      /**
       * Bot attribute IDs to delete
       */
      ids: Array<string>;
    },
  }): CancelablePromise<APIResponseBoolean> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/system-config/bot_attributes/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Get Bot Attribute
   * Get a bot attribute by ID
   * @returns APIResponseBotAttribute Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerSystemConfigBotAttributes3({
    botAttributeId,
  }: {
    botAttributeId: string,
  }): CancelablePromise<APIResponseBotAttribute> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/system-config/bot_attributes/{bot_attribute_id}',
      path: {
        'bot_attribute_id': botAttributeId,
      },
    });
  }
  /**
   * Update Bot Attribute
   * Update a bot attribute
   * @returns APIResponseBotAttribute Updated Successfully
   * @throws ApiError
   */
  public putApisV1ManagerSystemConfigBotAttributes1({
    botAttributeId,
    requestBody,
  }: {
    botAttributeId: string,
    requestBody: BotAttributeUpdateRequest,
  }): CancelablePromise<APIResponseBotAttribute> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/system-config/bot_attributes/{bot_attribute_id}',
      path: {
        'bot_attribute_id': botAttributeId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Delete Bot Attribute
   * Delete a bot attribute
   * @returns APIResponseBoolean Deleted Successfully
   * @throws ApiError
   */
  public deleteApisV1ManagerSystemConfigBotAttributes3({
    botAttributeId,
  }: {
    botAttributeId: string,
  }): CancelablePromise<APIResponseBoolean> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/system-config/bot_attributes/{bot_attribute_id}',
      path: {
        'bot_attribute_id': botAttributeId,
      },
    });
  }
}
