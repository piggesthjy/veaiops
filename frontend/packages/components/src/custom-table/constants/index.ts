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
 * CustomTable 常量统一导出

 *
 */

// 列相关常量
export * from './column';

// 重新导出类型常量中的枚举
export {
  PluginMethods,
  PluginNames,
  RendererNames,
} from '@/custom-table/types/constants/enum';

// 导出所有常量
export * from './features';
export * from './plugins';
// export * from './table'; // 暂时注释掉不存在的模块
// export * from './performance'; // 暂时注释掉不存在的模块

export interface FeatureFlags {
  [key: string]: boolean;
}
