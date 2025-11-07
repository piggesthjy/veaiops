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
 * 数据源向导业务逻辑工具函数 - 向后兼容导出
 * @description 该文件已被拆分并重组为模块化结构，此文件仅用于向后兼容
 *
 * 新的文件结构：
 * - steps/          步骤相关（验证、数据获取、工具函数）
 * - data/           数据处理（预填充、转换器）
 * - validation/     验证相关
 * - error-handling/ 错误处理
 * - helpers/        通用辅助函数
 *
 * @deprecated 请直接从 '../utils' 或子模块导入所需函数
 * @example
 * // 推荐用法
 * import { canProceed, handleStepDataFetch } from '../utils/steps';
 * import { prefillDataSourceConfig } from '../utils/data';
 *
 * @author AI Assistant
 * @date 2025-01-19
 */

// 重新导出所有函数以保持向后兼容性
export {
  // 步骤验证器
  canProceed,
  // 步骤数据获取器
  handleStepDataFetch,
  // 步骤工具函数
  getButtonText,
  getCurrentStepConfig,
  getDataSourceTypeDisplayName,
  getStepProgressText,
  isLastStep,
} from './index';
