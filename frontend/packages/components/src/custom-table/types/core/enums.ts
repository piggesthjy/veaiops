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
 * @name CustomTable 核心枚举定义
 * @description 基于现有源码提取的枚举值，替代字面量提升类型安全性

 *
 */

/**
 * 插件优先级枚举
 */
export enum PluginPriorityEnum {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * 插件优先级类型别名（保持向后兼容）
 */
export type PluginPriority = PluginPriorityEnum;

/**
 * 插件状态枚举
 */
export enum PluginStatusEnum {
  INACTIVE = 'inactive',
  INSTALLING = 'installing',
  INSTALLED = 'installed',
  ACTIVE = 'active',
  ERROR = 'error',
  DISABLED = 'disabled',
  DESTROYED = 'destroyed',
}

/**
 * 插件生命周期阶段枚举
 */
export enum LifecyclePhaseEnum {
  BEFORE_MOUNT = 'beforeMount',
  AFTER_MOUNT = 'afterMount',
  BEFORE_UPDATE = 'beforeUpdate',
  AFTER_UPDATE = 'afterUpdate',
  BEFORE_UNMOUNT = 'beforeUnmount',
  AFTER_UNMOUNT = 'afterUnmount',
  ON_MOUNT = 'onMount',
  ON_UNMOUNT = 'onUnmount',
  ON_UPDATE = 'onUpdate',
  ON_DESTROY = 'onDestroy',
}

/**
 * 表格操作类型枚举
 */
export enum TableActionEnum {
  PAGINATE = 'paginate',
  SORT = 'sort',
  FILTER = 'filter',
}

/**
 * 排序方向枚举
 */
export enum SortDirectionEnum {
  ASCEND = 'ascend',
  DESCEND = 'descend',
}

/**
 * 表格特性枚举
 */
export enum TableFeatureEnum {
  PAGINATION = 'enablePagination',
  SORTING = 'enableSorting',
  FILTERING = 'enableFilter',
  SELECTION = 'enableSelection',
  COLUMN_RESIZE = 'enableColumnResize',
  FULL_SCREEN = 'enableFullScreen',
}

/**
 * 分页属性枚举
 */
export enum PaginationPropertyEnum {
  SHOW_TOTAL = 'showTotal',
  SHOW_JUMPER = 'showJumper',
  SHOW_PAGE_SIZE = 'showSizeChanger', // 注意：Arco 的实际属性名
  PAGE_SIZE_OPTIONS = 'pageSizeOptions',
  SIZE = 'size',
}

/**
 * 列固定位置枚举
 */
export enum ColumnFixedEnum {
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * 表格尺寸枚举
 */
export enum TableSizeEnum {
  MINI = 'mini',
  SMALL = 'small',
  DEFAULT = 'default',
  LARGE = 'large',
}

/**
 * 提示类型枚举
 */
export enum AlertTypeEnum {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * 插件名称枚举
 */
export enum PluginNameEnum {
  TABLE_ALERT = 'tableAlert',
  TABLE_COLUMNS = 'tableColumns',
  TABLE_FILTER = 'tableFilter',
  TABLE_PAGINATION = 'tablePagination',
  TABLE_SORTING = 'tableSorting',
  QUERY_SYNC = 'querySync',
  DATA_SOURCE = 'dataSource',
}

/**
 * 优先级映射类型
 */
export type PriorityMap = Record<PluginPriorityEnum, number>;

/**
 * 优先级映射常量
 */
export const PRIORITY_MAP: PriorityMap = {
  [PluginPriorityEnum.CRITICAL]: -1,
  [PluginPriorityEnum.HIGH]: 0,
  [PluginPriorityEnum.MEDIUM]: 1,
  [PluginPriorityEnum.LOW]: 2,
};

/**
 * 默认分页配置
 */
export const DEFAULT_PAGINATION_CONFIG = {
  current: 1,
  pageSize: 10,
  showTotal: true,
  showJumper: true,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  size: TableSizeEnum.DEFAULT,
} as const;

/**
 * 默认表格特性配置
 */
export const DEFAULT_FEATURE_CONFIG = {
  [TableFeatureEnum.PAGINATION]: true,
  [TableFeatureEnum.SORTING]: true,
  [TableFeatureEnum.FILTERING]: true,
  [TableFeatureEnum.SELECTION]: false,
  [TableFeatureEnum.COLUMN_RESIZE]: false,
  [TableFeatureEnum.FULL_SCREEN]: false,
} as const;
