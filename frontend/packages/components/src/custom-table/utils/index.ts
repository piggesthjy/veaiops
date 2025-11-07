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
 * CustomTable 工具函数统一导出
 */

// 数据处理工具
export {
  filterEmptyDataByKeys,
  formatTableData,
  filterTableData,
} from './data';

// 生命周期管理器
export {
  LifecycleManager,
  createLifecycleManager,
  mergeLifecycleConfigs,
} from './lifecycle-manager';

// 插件生命周期增强器
export {
  enhancePluginLifecycle,
  enhancePluginsLifecycle,
  addLifecycleTriggerToContext,
  hasLifecycleSupport,
  getPluginLifecyclePhases,
} from './plugin-lifecycle-enhancer';

// 格式化工具

// 查询参数工具
export { getParamsObject } from './query';

// Legacy 工具函数
export * from './legacy-utils';

// 数据源工具函数（从 data-source-helpers 导出）
export {
  buildRequestResult,
  extractResponseData,
  handleRequestError,
} from './data-source-helpers';

// 日志工具 - 通过层层导出实现最短路径（@/custom-table/utils）
export { devLog } from './log-utils';
export { resetLogCollector } from './reset-log-collector';

// 工具类型 - 已移动到 types 目录统一管理
// ResponseErrorType 可能不存在于 @veaiops/types，暂时注释
// export type { ResponseErrorType } from '@veaiops/types';
