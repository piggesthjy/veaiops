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
 * VolcAIOpsKit components unified export entry
 *
 * Export principles:
 * - Use selective exports to avoid type/name conflicts
 * - Group by feature modules to organize exports clearly
 * - Merge imports from the same source to improve readability
 * - Each directory exports via its own index.ts
 */

// ==================== Base components ====================
export * from './business';
export * from './button';
export * from './card';
export * from './cell-render';
export * from './config-provider';
export * from './constants';
export * from './shared';
export * from './subscription';
export * from './tip';
export * from './wrapper-with-title';

// ==================== Timezone-aware components ====================
// Explicitly export timezone-aware components to avoid conflicts with other exports
export {
  RangePicker,
  DatePicker,
  TimezoneAwareRangePicker,
  TimezoneAwareDatePicker,
} from './timezone-aware';

// ==================== CustomFields components ====================
// Note: Selective exports to avoid type conflicts
export { CustomFields } from './custom-fields';
export type * from './custom-fields/types';
export * from './custom-fields/utils';

// ==================== CustomTable components ====================
// Note: Selective exports of common components and hooks to avoid type conflicts
export {
  CustomTable,
  SubscriptionProvider,
  useBusinessTable,
  useSubscription,
  useTableRefreshHandlers,
} from './custom-table';
export type {
  BaseQuery,
  CustomTableActionType,
  FilterConfigItem,
  FilterItemConfig,
  HandleFilterProps,
  OperationWrappers,
  QueryFormat,
  QueryValue,
} from './custom-table';

// ==================== FormControl components ====================
// Note: Selective exports to avoid Option type conflicts
export {
  FormItemWrapper,
  Input,
  InputBlock,
  Select,
  SelectBlock,
} from './form-control';
export type {
  DataSourceSetter,
  Option,
  SelectDataSourceProps,
} from './form-control';

// ==================== Filters components ====================
// Note: Selective exports to avoid type conflicts
export type { FiltersProps } from './custom-table/types/core/common';
export type { FieldItem } from './filters';

// ==================== Other type exports ====================
export type { CustomTitleProps } from './custom-table/types/components/missing-types';

// ==================== EventHistoryTable components ====================
// Unified history event table component
export {
  EventHistoryTable,
  HistoryModuleType,
  getAllowedAgentTypes,
} from './event-history-table';
export type {
  EventHistoryTableProps,
  EventHistoryFilters,
} from './event-history-table';

// ==================== XGuide components ====================
// Note: Selective exports to avoid naming conflicts
export { XGuide } from './x-guide';
export type { IGuide, IStep } from './x-guide';
