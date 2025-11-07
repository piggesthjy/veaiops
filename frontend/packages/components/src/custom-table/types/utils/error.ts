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
 * CustomTable 工具函数相关错误类型定义
 *

 * @date 2025-12-19
 */

/**
 * @name 响应错误类型
 * @description 用于统一处理 API 响应错误
 */
export interface ResponseErrorType {
  /** @name 错误代码 */
  code: number;
  /** @name 错误信息 */
  message: string;
  /** @name 错误详情（可选） */
  details?: string;
  /** @name 错误堆栈（可选，开发环境使用） */
  stack?: string;
}
