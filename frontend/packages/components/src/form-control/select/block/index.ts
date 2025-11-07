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

// 主组件导出 - 使用重构后的版本
// StateSync 工具导出（从 logger 实例导出）
// 注意：使用 logger 实例而不是 SelectBlockLogger 类
import { SelectBlockLogger } from './logger';

export { SelectBlock } from './select-block';

// 插件系统导出 - 从专门的导出文件中导入
export * from './exports';

// 工具函数导出
export {
  getFrontEnumsOptions,
  getFrontEnumsByKey,
  splitPastedText,
  optionfy,
  ensureArray,
  removeUndefinedValues,
  isDataSourceSetter,
  defaultFilterOption,
  filterArrayByObjectCriteria,
  canConvertToNumber,
} from './util';

// 分隔符工具导出
export { TokenSeparatorUtils } from './plugins/paste-handler';

// 缓存存储导出
export { sessionStore } from './cache-store';

// 日志系统导出
export { logger, SelectBlockLogger, LogLevel } from './logger';
export type { LogEntry, LoggerConfig } from './logger';

export const StateSync = {
  forceLoadingSync: SelectBlockLogger.forceLoadingSync,
  verifyAndFixInconsistencies: SelectBlockLogger.verifyAndFixInconsistencies,
  checkStateConsistency: SelectBlockLogger.checkStateConsistency,
};

// 类型导出 - 组件相关
export type {
  VeArchSelectBlockProps,
  OptionfyProps,
  SelectDataSourceProps,
  Option,
  FinalSelectBlockProps,
  OptionsEntity,
  StandardEnum,
  SelectOption,
  EnumOptionConfigs,
  DataSourceSetter,
  SearchKeyConfig,
} from './types/interface';
