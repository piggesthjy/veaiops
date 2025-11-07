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
 * 监控数据源管理逻辑Hook模块化导出
 *
 * 🎯 拆分策略：
 * - use-monitor-crud.ts: CRUD操作
 * - use-monitor-state.ts: 状态管理
 * - use-monitor-handlers.ts: 事件处理器
 * - use-monitor-access-logic.ts: 整合主Hook
 */

export * from './use-monitor-crud';
export * from './use-monitor-state';
export * from './use-monitor-handlers';
export * from './use-monitor-access-logic';
