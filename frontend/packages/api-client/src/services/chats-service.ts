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
import type { APIResponseChat } from '../models/api-response-chat';
import type { ChatConfigUpdatePayload } from '../models/chat-config-update-payload';
import type { PaginatedAPIResponseChatList } from '../models/paginated-api-response-chat-list';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class ChatsService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get Chats By Bot Id
   * Get chats filtered by bot document uid with pagination
   * @returns PaginatedAPIResponseChatList Successful Response
   * @throws ApiError
   */
  public getApisV1ConfigChats({
    uid,
    skip,
    limit = 100,
    forceUpdate = false,
    isActive = true,
    name,
    enableFuncInterest,
    enableFuncProactiveReply,
  }: {
    /**
     * Bot Document ID to filter chats
     */
    uid: string,
    /**
     * Number of chats to skip
     */
    skip?: number,
    /**
     * Maximum number of chats to return
     */
    limit?: number,
    /**
     * Force update group chat information
     */
    forceUpdate?: boolean,
    /**
     * Filter chats by is_active status (default: true)
     */
    isActive?: boolean,
    /**
     * Filter chats by name (fuzzy search)
     */
    name?: string,
    /**
     * Filter chats by enable_func_interest status
     */
    enableFuncInterest?: boolean,
    /**
     * Filter chats by enable_func_proactive_reply status
     */
    enableFuncProactiveReply?: boolean,
  }): CancelablePromise<PaginatedAPIResponseChatList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/config/chats/{uid}',
      path: {
        'uid': uid,
      },
      query: {
        'skip': skip,
        'limit': limit,
        'force_update': forceUpdate,
        'is_active': isActive,
        'name': name,
        'enable_func_interest': enableFuncInterest,
        'enable_func_proactive_reply': enableFuncProactiveReply,
      },
    });
  }
  /**
   * Update Chat Config
   * Update chat configuration by document id
   * @returns APIResponseChat Updated Successfully
   * @throws ApiError
   */
  public putApisV1ConfigChatsConfig({
    uid,
    requestBody,
  }: {
    /**
     * Chat Document ID
     */
    uid: string,
    requestBody: ChatConfigUpdatePayload,
  }): CancelablePromise<APIResponseChat> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/config/chats/{uid}/config',
      path: {
        'uid': uid,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
