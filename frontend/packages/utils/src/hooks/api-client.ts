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

/**
 * API 客户端类型定义
 *
 * 这个文件定义了 API 客户端的类型接口，使得 hooks 可以独立于具体的 API 生成代码
 */

// 基础 API 类型
export interface APIResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
}

export interface APIError {
  message: string;
  status: number;
  details?: unknown;
}

export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

// API 客户端接口
export interface APIClient {
  // 认证相关
  login_for_access_token: (config?: RequestConfig) => Promise<unknown>;

  // 用户管理
  list_users: (config?: RequestConfig) => Promise<unknown>;
  get_user: (config?: { user_id: string } & RequestConfig) => Promise<unknown>;
  create_user: (config?: RequestConfig) => Promise<unknown>;
  update_user: (
    config?: { user_id: string } & RequestConfig,
    updates?: unknown,
  ) => Promise<unknown>;
  delete_user: (
    config?: { user_id: string } & RequestConfig,
  ) => Promise<unknown>;

  // 系统配置
  get_global_config: (config?: RequestConfig) => Promise<unknown>;

  // Webhook
  payload_webhook: (config?: RequestConfig) => Promise<unknown>;
}

// 服务接口
export interface AuthService {
  login_for_access_token: (config?: RequestConfig) => Promise<unknown>;
}

export interface ManagerService {
  create_user: (config?: RequestConfig) => Promise<unknown>;
  get_user: (config?: { user_id: string } & RequestConfig) => Promise<unknown>;
  list_users: (config?: RequestConfig) => Promise<unknown>;
  update_user: (
    config?: { user_id: string } & RequestConfig,
    updates?: unknown,
  ) => Promise<unknown>;
  delete_user: (
    config?: { user_id: string } & RequestConfig,
  ) => Promise<unknown>;
}

// 默认的 API 客户端实例（将在运行时注入）
let apiClientInstance: APIClient;
let authServiceInstance: AuthService;
let managerServiceInstance: ManagerService;

/**
 * 设置 API 客户端实例
 * 这个函数需要在应用启动时调用
 */
export function setApiClient(client: APIClient) {
  apiClientInstance = client;
}

/**
 * 设置服务实例
 */
export function setAuthService(service: AuthService) {
  authServiceInstance = service;
}

export function setManagerService(service: ManagerService) {
  managerServiceInstance = service;
}

/**
 * 获取 API 客户端实例
 */
export function getApiClient(): APIClient {
  if (!apiClientInstance) {
    throw new Error('API client not initialized. Call setApiClient() first.');
  }
  return apiClientInstance;
}

/**
 * 获取认证服务实例
 */
export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    throw new Error(
      'Auth service not initialized. Call setAuthService() first.',
    );
  }
  return authServiceInstance;
}

/**
 * 获取管理服务实例
 */
export function getManagerService(): ManagerService {
  if (!managerServiceInstance) {
    throw new Error(
      'Manager service not initialized. Call setManagerService() first.',
    );
  }
  return managerServiceInstance;
}
