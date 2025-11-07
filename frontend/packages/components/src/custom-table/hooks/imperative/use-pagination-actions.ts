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
 * CustomTable 分页操作 Hook
 * 负责处理分页相关的所有操作
 *

 * @date 2025-12-19
 */
import type {
  BaseQuery,
  BaseRecord,
  PluginContext,
} from '@/custom-table/types';

/**
 * @name 分页信息接口
 */
export interface PageInfo {
  current: number;
  pageSize: number;
  total: number;
}

/**
 * @name 分页操作相关的实例方法
 */
export interface PaginationActionMethods {
  /** @name 设置当前页码 */
  setCurrentPage: (page: number) => void;
  /** @name 设置页面大小 */
  setPageSize: (size: number) => void;
  /** @name 设置页码和页面大小 */
  setPage: (page: number, pageWidth?: number) => void;
  /** @name 获取当前页码 */
  getCurrentPage: () => number;
  /** @name 获取页面大小 */
  getPageSize: () => number;
  /** @name 获取总条数 */
  getTotal: () => number;
  /** @name 重置分页配置 */
  resetPagination: () => void;
  /** @name 获取分页信息 */
  getPage: () => PageInfo;
  /** @name 获取页面信息 (别名) */
  getPageInfo: () => { current: number; pageSize: number; total: number };
  /** @name 设置页面信息 */
  setPageInfo: (pageInfo: {
    current?: number;
    pageSize?: number;
    total?: number;
  }) => void;
}

/**
 * @name 创建分页操作方法
 * @description 基于 pro-components 分页设计模式
 */
export const createPaginationActions = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  context: PluginContext<RecordType, QueryType>,
  state: {
    current: number;
    pageSize: number;
    tableTotal: number;
  },
): PaginationActionMethods => {
  const { current, pageSize, tableTotal } = state;

  return {
    /** @name 设置当前页码 */
    setCurrentPage: (page: number) => context.helpers.setCurrent(page),

    /** @name 设置页面大小 */
    setPageSize: (size: number) => context.helpers.setPageSize(size),

    /** @name 设置页码和页面大小 */
    setPage: (page: number, pageWidth?: number) => {
      context.helpers.setCurrent(page);
      if (pageWidth) {
        context.helpers.setPageSize(pageWidth);
      }
    },

    /** @name 获取当前页码 */
    getCurrentPage: () => current,

    /** @name 获取页面大小 */
    getPageSize: () => pageSize,

    /** @name 获取总条数 */
    getTotal: () => tableTotal,

    /** @name 重置分页配置 */
    resetPagination: () => {
      context.helpers.setCurrent(1);
      context.helpers.setPageSize(10);
    },

    /** @name 获取分页信息 */
    getPage: () => ({
      current,
      pageSize,
      total: tableTotal,
    }),

    /** @name 获取页面信息 (别名) */
    getPageInfo: () => ({
      current,
      pageSize,
      total: tableTotal,
    }),

    /** @name 设置页面信息 */
    setPageInfo: (pageInfo: {
      current?: number;
      pageSize?: number;
      total?: number;
    }) => {
      if (pageInfo.current !== undefined) {
        context.helpers.setCurrent(pageInfo.current);
      }
      if (pageInfo.pageSize !== undefined) {
        context.helpers.setPageSize(pageInfo.pageSize);
      }
      // total 通常通过数据加载自动设置，这里暂不处理
    },
  };
};
