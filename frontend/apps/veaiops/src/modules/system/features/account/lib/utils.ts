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
 * 账号管理工具函数 - 统一导出
 * @description 账号管理相关的工具函数和辅助方法
 *
 * 此文件已拆分为多个子模块以提高可维护性：
 * - formatters.ts: 格式化函数
 * - validators.ts: 验证函数
 * - validation-helpers.ts: 验证辅助函数
 * - permissions.ts: 权限检查函数
 * - helpers.ts: 辅助函数
 *
 * 为保持向后兼容，统一从此文件重新导出所有函数
 */

// 导出格式化函数
export * from './formatters';

// 导出验证函数
export * from './validators';

// 导出验证辅助函数
export * from './validation-helpers';

// 导出权限函数
export * from './permissions';

// 导出辅助函数
export * from './helpers';
