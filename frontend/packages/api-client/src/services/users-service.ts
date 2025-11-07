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
import type { APIResponseUser } from '../models/api-response-user';
import type { PaginatedAPIResponseUserList } from '../models/paginated-api-response-user-list';
import type { UpdatePasswordRequest } from '../models/update-password-request';
import type { UserCreateRequest } from '../models/user-create-request';
import type { UserUpdateRequest } from '../models/user-update-request';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class UsersService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * List Users
   * List all users with optional username fuzzy matching
   * @returns PaginatedAPIResponseUserList Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerUsers({
    skip,
    limit = 100,
    username,
  }: {
    /**
     * Skip the first N users
     */
    skip?: number,
    /**
     * Limit the number of users returned
     */
    limit?: number,
    /**
     * Filter users by username (fuzzy matching)
     */
    username?: string,
  }): CancelablePromise<PaginatedAPIResponseUserList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/users/',
      query: {
        'skip': skip,
        'limit': limit,
        'username': username,
      },
    });
  }
  /**
   * Create User
   * Create a new user
   * @returns APIResponseUser Created Successfully
   * @throws ApiError
   */
  public postApisV1ManagerUsers({
    requestBody,
  }: {
    requestBody: UserCreateRequest,
  }): CancelablePromise<APIResponseUser> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/users/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Get User
   * Get a user by ID
   * @returns APIResponseUser Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerUsers1({
    userId,
  }: {
    userId: string,
  }): CancelablePromise<APIResponseUser> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/users/{user_id}',
      path: {
        'user_id': userId,
      },
    });
  }
  /**
   * Update User
   * Update an existing user (excluding password)
   * @returns APIResponse Updated Successfully
   * @throws ApiError
   */
  public putApisV1ManagerUsers({
    userId,
    requestBody,
  }: {
    userId: string,
    requestBody: UserUpdateRequest,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/users/{user_id}',
      path: {
        'user_id': userId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Delete User
   * Delete a user
   * @returns APIResponse Deleted Successfully
   * @throws ApiError
   */
  public deleteApisV1ManagerUsers({
    userId,
  }: {
    userId: string,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/users/{user_id}',
      path: {
        'user_id': userId,
      },
    });
  }
  /**
   * Update Password
   * Update user password
   * @returns APIResponse Password Updated Successfully
   * @throws ApiError
   */
  public putApisV1ManagerUsersPassword({
    userId,
    requestBody,
  }: {
    userId: string,
    requestBody: UpdatePasswordRequest,
  }): CancelablePromise<APIResponse> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/users/{user_id}/password',
      path: {
        'user_id': userId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
