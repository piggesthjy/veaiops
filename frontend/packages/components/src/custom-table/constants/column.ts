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
 * 表格列相关常量定义

 *
 */

/**
 * 列常量
 */
export const ColumnConstant = {
  SELECT_ALL: 'selectAll',
  EMPTY: 'empty',
} as const;

/**
 * 空内容占位符
 */
export const EMPTY_CONTENT = '--';

// 注意：ColumnConstantType 未使用，已移除
// export type ColumnConstantType = typeof ColumnConstant;
