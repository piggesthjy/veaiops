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
 * 表格分页插件
 */
import { PluginNames } from '@/custom-table/constants/enum';
import type {
  TablePaginationConfig as PaginationConfig,
  PluginFactory,
} from '@/custom-table/types';
import { PluginPriorityEnum } from '@/custom-table/types/core/enums';
import { DEFAULT_TABLE_PAGINATION_CONFIG } from './config';
import {
  type ExtendedPaginationConfig,
  afterUpdate,
  getPaginationConfig,
  getPaginationInfo,
  install,
  renderPagination,
  resetPagination,
  setup,
  uninstall,
} from './core';

/**
 * 表格分页插件工厂函数
 */
export const TablePaginationPlugin = (
  config: Partial<PaginationConfig> = {},
): ReturnType<PluginFactory<Partial<PaginationConfig>>> => {
  const extendedConfig = config as ExtendedPaginationConfig;
  const finalConfig: ExtendedPaginationConfig = {
    ...DEFAULT_TABLE_PAGINATION_CONFIG,
    ...config,
    defaultPageSize: extendedConfig.defaultPageSize ?? 10,
    showJumper: extendedConfig.showJumper ?? true,
    showPageSize: extendedConfig.showPageSize ?? true,
  };

  return {
    name: PluginNames.TABLE_PAGINATION,
    version: '1.0.0',
    description: '表格分页插件',
    priority: finalConfig.priority || PluginPriorityEnum.MEDIUM,
    enabled: finalConfig.enabled !== false,
    dependencies: [],
    conflicts: [],

    // 生命周期方法
    install,
    setup: (context) => setup({ context, finalConfig }),
    afterUpdate,
    uninstall,

    // 分页钩子
    hooks: {
      getPaginationInfo,
      getPaginationConfig,
      resetPagination,
    },

    // 渲染方法
    render: {
      pagination: (context) => renderPagination({ context, finalConfig }),
    },
  };
};
