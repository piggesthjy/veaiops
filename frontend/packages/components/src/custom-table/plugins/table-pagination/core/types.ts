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
 * 表格分页插件类型定义
 */
import type {
  TablePaginationConfig as PaginationConfig,
  PluginPriority,
} from '@/custom-table/types';

/**
 * 扩展的分页配置类型，包含插件需要的额外属性
 */
export interface ExtendedPaginationConfig extends PaginationConfig {
  defaultPageSize?: number;
  defaultCurrent?: number;
  showJumper?: boolean;
  showPageSize?: boolean;
  autoReset?: boolean;
  priority?: PluginPriority;
}
