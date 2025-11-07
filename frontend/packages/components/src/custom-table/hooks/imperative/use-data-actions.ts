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

import type {
  BaseQuery,
  BaseRecord,
  PluginContext,
  RequestManager,
} from '@/custom-table/types';
/**
 * CustomTable 数据操作 Hook
 * 负责处理数据的加载、刷新、取消等操作
 *

 * @date 2025-12-19
 */
import { logger } from '@veaiops/utils';

/**
 * @name 数据操作相关的实例方法
 */
export interface DataActionMethods<RecordType extends BaseRecord> {
  /** @name 重新加载数据 */
  reload: (resetPageIndex?: boolean) => Promise<void>;
  /** @name 刷新数据（重置页码并清空选择） */
  refresh: () => Promise<void>;
  /** @name 取消当前进行中的请求 */
  cancel: () => void;
  /** @name 获取当前表格数据 */
  getData: () => RecordType[];
  /** @name 获取数据源 */
  getDataSource: () => RecordType[];
  /** @name 获取格式化后的表格数据 */
  getFormattedData: () => RecordType[];
  /** @name 设置表格数据 */
  setData: (data: RecordType[]) => void;
  /** @name 获取筛选后的数据 */
  getFilteredData: () => RecordType[];
  /** @name 获取选中的数据 */
  getSelectedData: () => RecordType[];
}

/**
 * @name 创建数据操作方法
 * @description 基于 pro-components ActionRef 数据操作设计模式
 */
export const createDataActions = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  context: PluginContext<RecordType, QueryType>,
  formattedTableData: RecordType[],
  getRequestManager: () => RequestManager,
): DataActionMethods<RecordType> => ({
  /** @name 重新加载数据 */
  reload: async (resetPageIndex?: boolean) => {
    // 取消当前进行中的请求
    getRequestManager().abort();

    // 如果需要重置页码到第一页
    if (resetPageIndex && context.helpers.setCurrent) {
      context.helpers.setCurrent(1);
    }

    // 触发数据重新加载
    if (context.helpers.run) {
      context.helpers.run();
    }
  },

  /** @name 刷新数据（重置页码并清空选择） */
  refresh: async () => {
    logger.info({
      message: '[CustomTable.refresh] 🔄 refresh 方法被调用',
      data: {
        hasRun: Boolean(context.helpers.run),
        hasSetCurrent: Boolean(context.helpers.setCurrent),
        hasSetSelectedRowKeys: Boolean(context.helpers.setSelectedRowKeys),
      },
      source: 'CustomTable',
      component: 'DataActions.refresh',
    });

    // 取消当前请求
    getRequestManager().abort();

    // 清空选择状态
    if (context.helpers.setSelectedRowKeys) {
      logger.info({
        message: '[CustomTable.refresh] 清空选择状态',
        data: {},
        source: 'CustomTable',
        component: 'DataActions.refresh',
      });
      context.helpers.setSelectedRowKeys([]);
    }

    // 重置到第一页
    if (context.helpers.setCurrent) {
      logger.info({
        message: '[CustomTable.refresh] 重置到第一页',
        data: {},
        source: 'CustomTable',
        component: 'DataActions.refresh',
      });
      context.helpers.setCurrent(1);
    }

    // 重新加载数据
    if (context.helpers.run) {
      logger.info({
        message:
          '[CustomTable.refresh] 🚀 调用 context.helpers.run() 重新加载数据',
        data: {},
        source: 'CustomTable',
        component: 'DataActions.refresh',
      });
      context.helpers.run();
      logger.info({
        message: '[CustomTable.refresh] ✅ context.helpers.run() 调用完成',
        data: {},
        source: 'CustomTable',
        component: 'DataActions.refresh',
      });
    } else {
      logger.warn({
        message: '[CustomTable.refresh] ⚠️ context.helpers.run 不存在',
        data: {
          helpersKeys: Object.keys(context.helpers || {}),
        },
        source: 'CustomTable',
        component: 'DataActions.refresh',
      });
    }
  },

  /** @name 取消当前进行中的请求 */
  cancel: () => {
    const requestManager = getRequestManager();
    if (!requestManager.isAborted()) {
      requestManager.abort();
    }
  },

  /** @name 获取当前表格数据 */
  getData: () => formattedTableData,

  /** @name 获取数据源 */
  getDataSource: () => formattedTableData,

  /** @name 获取格式化后的表格数据 */
  getFormattedData: () => formattedTableData,

  /** @name 设置表格数据 */
  setData: (_data: RecordType[]) => {
    // 基于 pro-components 的设计，通过重置数据源实现
    // 注意：这里应该配合数据源插件来实现实际的数据更新
    if (context.helpers.reset) {
      context.helpers.reset();
    }
  },

  /** @name 获取筛选后的数据 */
  getFilteredData: () => formattedTableData,

  /** @name 获取选中的数据 */
  getSelectedData: () => {
    const { selectedRowKeys } = context.state;
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      return [];
    }
    // 根据选中的键从数据源中筛选出对应的数据
    return formattedTableData.filter((record) => {
      const key =
        typeof context.props.rowKey === 'function'
          ? context.props.rowKey(record)
          : (record as Record<string, unknown>)[context.props.rowKey || 'id'];
      return selectedRowKeys.includes(key as string | number);
    });
  },
});
