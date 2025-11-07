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
 * CustomTable 工具操作 Hook
 * 负责处理导出、滚动、验证、重置等操作
 *

 * @date 2025-12-19
 */
import type {
  BaseQuery,
  BaseRecord,
  PluginContext,
  PluginManager,
  PluginPerformanceMetrics,
  RequestManager,
} from '@/custom-table/types';

/**
 * @name 重置选项接口
 */
export interface ResetOptions {
  /** @name 是否重置数据 */
  resetData?: boolean;
  /** @name 是否重置查询参数 */
  resetQuery?: boolean;
  /** @name 是否重置筛选条件 */
  resetFilters?: boolean;
  /** @name 是否重置选择状态 */
  resetSelection?: boolean;
  /** @name 是否重置展开状态 */
  resetExpandedRows?: boolean;
}

/**
 * @name 工具操作相关的实例方法
 */
export interface UtilityActionMethods<RecordType extends BaseRecord> {
  /** @name 导出数据 */
  exportData: (format?: 'excel' | 'csv' | 'json') => RecordType[];
  /** @name 滚动到顶部 */
  scrollToTop: () => void;
  /** @name 滚动到底部 */
  scrollToBottom: () => void;
  /** @name 滚动到指定行 */
  scrollToRow: (index: number) => void;
  /** @name 验证表格状态 */
  validate: () => Promise<boolean>;
  /** @name 重置表格状态 */
  reset: (options?: ResetOptions) => void;
  /** @name 获取表格实例 */
  getTableInstance: () => unknown;
  /** @name 获取插件管理器 */
  getPluginManager: () => PluginManager;
  /** @name 获取性能指标 */
  getPerformanceMetrics: () => PluginPerformanceMetrics;
}

/**
 * @name 创建工具操作方法
 * @description 基于 pro-components 工具函数设计模式
 */
export const createUtilityActions = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  context: PluginContext<RecordType, QueryType>,
  formattedTableData: RecordType[],
  pluginManager: PluginManager,
  getRequestManager: () => RequestManager,
): UtilityActionMethods<RecordType> => ({
  /** @name 导出数据 */
  exportData: (format: 'excel' | 'csv' | 'json' = 'excel'): RecordType[] => {
    const dataToExport = formattedTableData;

    if (format === 'json') {
      // JSON 格式导出
      const jsonStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `table-data-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // CSV 格式导出 - 简单实现
      if (dataToExport.length > 0) {
        const headers = Object.keys(dataToExport[0] as Record<string, unknown>);
        const csvContent = [
          headers.join(','),
          ...dataToExport.map((row) =>
            headers
              .map((header) =>
                JSON.stringify((row as Record<string, unknown>)[header] || ''),
              )
              .join(','),
          ),
        ].join('\n');

        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `table-data-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } else {
      // Excel 格式导出 - 使用 HTML table 方式实现基本导出
      if (dataToExport.length === 0) {
        // 数据为空，不进行导出

        return dataToExport;
      }

      const headers = Object.keys(dataToExport[0] as Record<string, unknown>);
      const htmlTable = [
        '<table>',
        '<thead><tr>',
        ...headers.map((header) => `<th>${header}</th>`),
        '</tr></thead>',
        '<tbody>',
        ...dataToExport.map(
          (row) =>
            `<tr>${headers
              .map((header) => {
                const value = (row as Record<string, unknown>)[header];
                let displayValue = '';
                if (value == null) {
                  displayValue = '';
                } else if (typeof value === 'object') {
                  displayValue = JSON.stringify(value);
                } else {
                  displayValue = String(value);
                }
                return `<td>${displayValue}</td>`;
              })
              .join('')}</tr>`,
        ),
        '</tbody>',
        '</table>',
      ].join('');

      const blob = new Blob([htmlTable], {
        type: 'application/vnd.ms-excel',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `table-data-${Date.now()}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return dataToExport;
  },

  /** @name 滚动到顶部 */
  scrollToTop: () => {
    const tableElement = document.querySelector('.arco-table-body');
    if (tableElement) {
      tableElement.scrollTop = 0;
    }
  },

  /** @name 滚动到底部 */
  scrollToBottom: () => {
    const tableElement = document.querySelector('.arco-table-body');
    if (tableElement) {
      tableElement.scrollTop = tableElement.scrollHeight;
    }
  },

  /** @name 滚动到指定行 */
  scrollToRow: (index: number) => {
    const rowElement = document.querySelector(`[data-row-key="${index}"]`);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  /** @name 验证表格状态 */
  validate: async (): Promise<boolean> => {
    // 基于 pro-components 验证设计
    try {
      // 检查是否有进行中的请求
      const requestManager = getRequestManager();
      if (requestManager.currentController && !requestManager.isAborted()) {
        return false;
      }

      // 检查数据完整性
      if (!formattedTableData || formattedTableData.length === 0) {
        return false;
      }

      // 检查插件状态
      if (!pluginManager || pluginManager.getAllPlugins().length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      // 检查插件状态失败，返回 false（静默处理）
      return false;
    }
  },

  /** @name 重置表格状态 */
  reset: (options: ResetOptions = {}) => {
    const {
      resetData = true,
      resetQuery = true,
      resetFilters = true,
      resetSelection = true,
      resetExpandedRows = true,
    } = options;

    // 取消进行中的请求
    getRequestManager().abort();

    // 重置数据
    if (resetData && context.helpers.reset) {
      context.helpers.reset();
    }

    // 重置查询参数
    if (resetQuery && context.helpers.setQuery) {
      context.helpers.setQuery({} as QueryType);
    }

    // 重置筛选条件
    if (resetFilters && context.helpers.setFilters) {
      context.helpers.setFilters({});
    }

    // 重置选择状态
    if (resetSelection && context.helpers.setSelectedRowKeys) {
      context.helpers.setSelectedRowKeys([]);
    }

    // 重置展开状态
    if (resetExpandedRows && context.helpers.setExpandedRowKeys) {
      context.helpers.setExpandedRowKeys([]);
    }
  },

  /** @name 获取表格实例 */
  getTableInstance: () => null, // 返回实际的 Arco Table 实例

  /** @name 获取插件管理器 */
  getPluginManager: () => pluginManager,

  /** @name 获取性能指标 */
  getPerformanceMetrics: () => pluginManager.getMetrics(),
});
