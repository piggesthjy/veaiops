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
 * 日志导出工具 - 向后兼容导出
 *
 * 注意：此文件引用的 ./log-exporter/ 目录可能不存在
 * 目前统一通过 ./index.ts 导出所有日志相关功能
 *
 * @deprecated 建议从 '../index' 导入（即从 logger 目录统一导出）
 */

// 重新导出核心功能，保持向后兼容
export { logger } from './core';
export type { LogEntry, LoggerConfig } from './core';
export {
  exportLogsToFile,
  getLogCount,
  clearCollectedLogs,
  startLogCollection,
  stopLogCollection,
  exportLogsInTimeRange,
} from './export';
