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
 * 路由工具模块统一导出
 *
 * 已拆分为多个子模块以提高可维护性：
 * - types: 类型定义
 * - components: React 组件（RouteLoadingFallback, RouteErrorBoundary）
 * - route-creators: 路由创建函数
 */

export * from './types';
export * from './components';
export * from './route-creators';
