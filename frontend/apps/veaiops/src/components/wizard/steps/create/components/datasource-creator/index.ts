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
 * 数据源创建器统一导出
 */

// 类型定义
export type { CreateResult } from './types';

// 验证器
export { validateConfiguration } from './validators';

// 创建函数
export {
  createAliyunDataSource,
  createDataSource,
  createVolcengineDataSource,
  createZabbixDataSource,
} from './creators';

// 更新函数
export {
  updateAliyunDataSource,
  updateDataSource,
  updateVolcengineDataSource,
  updateZabbixDataSource,
} from './updaters';

// 工具函数
export { processApiError } from './utils';
