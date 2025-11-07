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
 * CustomTable Hooks 统一导出
 * 参考 pro-components 设计，提供统一的对外 API
 *

 *
 */

// 核心 hooks
export { useCustomTable } from './use-custom-table';
export {
  useStableCallback,
  useStableObject,
  useStableHandler,
  useStableProps,
} from './use-stable-props';
// export { useTableState } from './use-table-state'; // 注释掉避免与 internal 中的重复导出

// 业务表格统一 hook
export {
  useBusinessTable,
  type BusinessTableConfigOptions,
  type BusinessTableConfigResult,
  type OperationWrappers,
} from './use-business-table';

// 刷新集成 hook
export {
  useTableRefreshIntegration,
  type TableRefreshIntegrationOptions,
  type TableRefreshIntegrationReturn,
} from './use-table-refresh-integration';

// 开箱即用的刷新处理器 hook
export {
  useTableRefreshHandlers,
  useSimpleTableRefresh,
  type RefreshHandlers,
  type UseTableRefreshHandlersOptions,
  type UseTableRefreshHandlersReturn,
} from './use-table-refresh-handlers';

// 插件相关 hooks
export { useDataSource } from './use-data-source';
export { useAlert } from './use-alert';
export { useAutoScrollYWithCalc } from './use-auto-scroll-y';
export { useTableColumns } from './use-table-columns';
export { useQuerySync } from './use-query-sync';
export { usePluginManager } from './use-plugin-manager';

// 列配置管理Hook
export { useColumns as useColumnConfig } from './use-column-config';

// 渲染器 hooks
export { useCustomTableRenderers } from './use-custom-table-renderers';

// 上下文 hooks
export {
  useCustomTableContext,
  useEnhancedTableContext,
} from './use-custom-table-context';

// 生命周期 hooks
export { useLifecycleManager } from './use-lifecycle-manager';

// 订阅机制 hooks
export { SubscriptionProvider, useSubscription } from './use-subscription';

// 工具 hooks
export { useImperativeHandle } from './use-imperative-handle';

// 内部 hooks
export * from './internal';

// 命令式 hooks
export * from './imperative';
