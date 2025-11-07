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
 * CustomTable 功能常量类型定义
 *

 * @date 2025-12-19
 */

/**
 * @name 功能开关类型
 * @description 基于 DEFAULT_FEATURES 常量推断的功能开关类型
 */
export type FeatureFlags = {
  /** @name 是否启用分页功能 */
  enablePagination: boolean;
  /** @name 是否启用筛选功能 */
  enableFilter: boolean;
  /** @name 是否启用排序功能 */
  enableSorting: boolean;
  /** @name 是否启用选择功能 */
  enableSelection: boolean;
  /** @name 是否启用搜索功能 */
  enableSearch: boolean;
  /** @name 是否启用工具栏功能 */
  enableToolbar: boolean;
  /** @name 是否启用警告提示功能 */
  enableAlert: boolean;
  /** @name 是否启用查询同步功能 */
  enableQuerySync: boolean;
  /** @name 是否启用数据源功能 */
  enableDataSource: boolean;
  /** @name 是否启用列管理功能 */
  enableColumns: boolean;
  /** @name 是否启用自定义加载功能 */
  enableCustomLoading: boolean;
  /** @name 是否启用行选择功能 */
  enableRowSelection: boolean;
  /** @name 是否启用列宽持久化功能 */
  enableColumnWidthPersistence: boolean;
};
