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
import type { APIResponseLoginToken } from '../models/api-response-login-token';
import type { LoginRequest } from '../models/login-request';
import type { RefreshTokenRequest } from '../models/refresh-token-request';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class AuthenticationService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Login For Access Token
   * Login to get access token
   * @returns APIResponseLoginToken Successful Response
   * @throws ApiError
   */
  public postApisV1AuthToken({
    requestBody,
  }: {
    requestBody: LoginRequest,
  }): CancelablePromise<APIResponseLoginToken> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/auth/token',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Simple Refresh Token
   * Refresh access token using existing token
   * @returns APIResponseLoginToken Successful Response
   * @throws ApiError
   */
  public postApisV1AuthRefreshToken({
    requestBody,
  }: {
    requestBody: RefreshTokenRequest,
  }): CancelablePromise<APIResponseLoginToken> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/auth/refresh-token',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
