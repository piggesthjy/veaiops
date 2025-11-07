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
 * Bot特别关注表格相关 Hooks 模块
 *
 * 此模块提供了Bot特别关注表格的配置、业务逻辑和聚合功能
 */

// 表格相关 Hooks（合并同源导入）
export {
  useBotAttributesTable,
  type UseBotAttributesTableParams,
  type UseBotAttributesTableReturn,
} from './table';

export {
  useBotAttributesTableConfig,
  type UseBotAttributesTableConfigParams,
  type UseBotAttributesTableConfigReturn,
} from './config';

export {
  useBotAttributesTableLogic,
  type UseBotAttributesTableLogicParams,
  type UseBotAttributesTableLogicReturn,
} from './logic';
