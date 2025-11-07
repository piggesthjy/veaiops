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
 * 表格分页插件生命周期方法
 */
import { createPaginationStateManager } from '@/custom-table/types/utils/state-managers';
import { createPaginationHelpers } from './helpers';
import type { ExtendedPaginationConfig } from './types';
import { getStateNumber } from './utils';

/**
 * 插件安装
 */
export function install(_context: any) {
  // 安装时的操作
}

/**
 * 插件设置
 */
/**
 * setup 参数接口
 */
export interface SetupParams {
  context: any;
  finalConfig: ExtendedPaginationConfig;
}

/**
 * 插件设置
 */
export function setup({ context, finalConfig }: SetupParams): void {
  // 初始化分页处理
  const currentPage = getStateNumber({
    value: context.state.current,
    defaultValue: 1,
  });
  const currentPageSize = getStateNumber({
    value: context.state.pageSize,
    defaultValue: finalConfig.defaultPageSize || 10,
  });

  // 插件设置逻辑 - 不调用 Hook，只进行配置
  // Hook 调用已移到组件层面
  // 分页状态由外层组件管理，这里只设置默认值
  Object.assign(context.state, {
    current: currentPage || 1,
    pageSize: currentPageSize || finalConfig.defaultPageSize || 10,
    isChangingPage: false,
  });

  // 添加分页相关方法到上下文
  Object.assign(context.helpers, createPaginationHelpers(context));
}

/**
 * 插件更新后
 */
export function afterUpdate(context: any) {
  // 当配置或数据更新时的操作
  // 更新分页相关方法
  Object.assign(context.helpers, createPaginationHelpers(context));
}

/**
 * 插件卸载
 */
export function uninstall(context: any) {
  // 卸载时的清理操作
  // 使用类型安全的状态管理器清理分页状态
  const paginationManager = createPaginationStateManager();
  // 类型断言以兼容不同的 PluginContext 泛型参数
  paginationManager.cleanupPaginationState(context);

  // 清理额外的分页方法
  const { helpers } = context;
  const helpersRecord = helpers as unknown as Record<string, unknown>;

  [
    'goToFirst',
    'goToLast',
    'goToNext',
    'goToPrevious',
    'resetPagination',
  ].forEach((method) => {
    if (method in helpers) {
      delete helpersRecord[method];
    }
  });
}
