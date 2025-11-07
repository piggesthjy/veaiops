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
 * 数据源向导工具函数统一导出
 * @description 提供向导相关的所有工具函数，现已按功能模块化组织
 * @author AI Assistant
 * @date 2025-01-19
 */

// 初始化日志收集
import { exportLogsToFile, startLogCollection } from '@veaiops/utils';

// 启动日志收集
startLogCollection();

// 添加全局日志导出函数到 window 对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).exportDataSourceWizardLogs = () => {
    exportLogsToFile('datasource-wizard-debug.log');
  };
}

// ============================================================================
// 步骤相关功能
// ============================================================================
export * from './steps';

// ============================================================================
// 数据处理功能
// ============================================================================
export * from './data';

// ============================================================================
// 验证功能
// ============================================================================
export * from './validation';

// ============================================================================
// 错误处理
// ============================================================================
export * from './error-handling';
