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
 * Bot管理自定义Hooks统一导出
 */

// 业务逻辑Hooks（表格相关）
export {
  useBot,
  useBotActionConfig,
  useBotTableConfig,
} from './table';

// 表单相关Hooks
export { useBotForm } from './form';

// 属性相关Hooks（类型从 @bot/types 统一导出，避免重复）
export {
  useBotAttributes,
  useBotAttributesTable,
  useBotAttributesTableConfig,
  useBotAttributesTableLogic,
  type UseBotAttributesTableConfigParams,
  type UseBotAttributesTableConfigReturn,
  type UseBotAttributesTableLogicParams,
  type UseBotAttributesTableLogicReturn,
  type UseBotAttributesTableParams,
  type UseBotAttributesTableReturn,
} from './attributes';

// 聊天相关Hooks
export { useBotChat, useChatManagementLogic, useChatTableConfig } from './chat';

// 共享Hooks - 可被其他模块使用
export { useBotList } from './list';
