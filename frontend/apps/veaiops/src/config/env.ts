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
 * 环境变量配置
 * 统一管理前端环境变量，避免直接使用 process.env
 */

export const ENV = {
  // API 基础地址
  API_BASE_URL: 'http://localhost:8000',

  // 环境类型
  NODE_ENV: 'development',

  // 是否为开发环境
  get isDevelopment() {
    return true; // 在开发模式下始终为 true
  },

  // 是否为生产环境
  get isProduction() {
    return false; // 在开发模式下始终为 false
  },
} as const;

export default ENV;
