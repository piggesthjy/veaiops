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
 * API 错误类型定义
 */
export interface ApiError {
  status: number;
  message?: string;
  // 支持API返回的错误格式
  code?: number;
  data?: any;
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerConfig {
  /** 401 错误消息 */
  unauthorizedMessage?: string;
  /** 404 错误消息 */
  notFoundMessage?: string;
  /** 409 错误消息 */
  conflictMessage?: string;
  /** 默认错误消息 */
  defaultMessage?: string;
}
