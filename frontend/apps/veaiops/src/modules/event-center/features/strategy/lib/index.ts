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
 * 策略管理 Lib 统一导出
 *
 * ✅ 简化导出：
 * - 统一使用 strategyApi（已合并 service 功能）
 * - 简化导出路径
 */
// ✅ 简化导出：统一使用 strategyApi
export { strategyApi } from './api';
export { adaptStrategyForEdit } from './types';
// ✅ 向后兼容：导出 strategyService（如果存在）
export { strategyService } from './service';
// InformStrategy 直接从 'api-generate' 导入（符合单一数据源原则）
