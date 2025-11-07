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
 * 枚举类型定义
 * 类型已迁移到 ../types/constants/enum.ts
 * 此文件保留以兼容现有引用，实际类型请从types目录导入
 */

// 重新导出枚举值 - 直接从具体文件导入避免循环引用
export {
  PluginNames,
  PluginMethods,
  RendererNames,
} from '@/custom-table/types/constants/enum';

// PluginPriority 在 types/core/enums.ts 中定义，需要从 core 导入
// 注意：PluginPriority 是类型别名，不是枚举，通过 types/index.ts 统一导出
export type { PluginPriority } from '@/custom-table/types/core/enums';
