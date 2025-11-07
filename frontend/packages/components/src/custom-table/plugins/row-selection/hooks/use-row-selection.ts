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
  BaseRecord,
  BatchActionConfig,
  RowSelectionConfig,
  RowSelectionState,
} from '@/custom-table/types';
import { devLog } from '@/custom-table/utils';
/**
 * 行选择 Hook
 * 基于 Arco Table 的 useRowSelection 增强
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Key } from 'react';

export interface UseRowSelectionOptions<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 表格数据 */
  data: RecordType[];
  /** 配置 */
  config: RowSelectionConfig<RecordType>;
  /** 获取行 key 的函数 */
  getRowKey: (record: RecordType) => Key;
  /** 当前页数据 */
  pageData?: RecordType[];
  /** 总数据量 */
  totalCount?: number;
}

export interface UseRowSelectionReturn<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 当前状态 */
  state: RowSelectionState<RecordType>;
  /** 选择行 */
  selectRow: (params: { key: Key; selected: boolean }) => void;
  /** 全选/取消全选 */
  selectAll: (selected: boolean) => void;
  /** 清空选择 */
  clearSelection: () => void;
  /** 获取选中的行数据 */
  getSelectedRows: () => RecordType[];
  /** 是否选中指定行 */
  isRowSelected: (key: Key) => boolean;
  /** 执行批量操作 */
  executeBatchAction: (action: BatchActionConfig<RecordType>) => Promise<void>;
  /** Arco Table 的 rowSelection 配置 */
  rowSelectionProps: {
    type?: 'checkbox' | 'radio';
    selectedRowKeys: Key[];
    onSelect: (record: RecordType, selected: boolean) => void;
    onSelectAll: (
      selected: boolean,
      selectedRows: RecordType[],
      changeRows: RecordType[],
    ) => void;
    checkboxProps?: (record: RecordType) => { disabled?: boolean };
    checkAll?: boolean;
    checkStrictly?: boolean;
    checkCrossPage?: boolean;
    columnTitle?: string | React.ReactNode;
    columnWidth?: number;
    fixed?: boolean;
    preserveSelectedRowKeys?: boolean;
    renderCell?: (
      originNode: React.ReactNode,
      checked: boolean,
      record: RecordType,
    ) => React.ReactNode;
  };
}

export const useRowSelection = <RecordType extends BaseRecord = BaseRecord>({
  data,
  config,
  getRowKey,
  pageData = data,
  totalCount = data.length,
}: UseRowSelectionOptions<RecordType>): UseRowSelectionReturn<RecordType> => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>(
    config.selectedRowKeys || [],
  );
  const [allSelectedKeys, setAllSelectedKeys] = useState<Key[]>([]);
  const selectedRowsCache = useRef<Map<Key, RecordType>>(new Map());

  // 更新缓存
  useEffect(() => {
    data.forEach((record) => {
      const key = getRowKey(record);
      if (selectedRowKeys.includes(key)) {
        selectedRowsCache.current.set(key, record);
      }
    });
  }, [data, selectedRowKeys, getRowKey]);

  // 计算选择统计
  const selectionStat = useMemo(
    () => ({
      selectedCount: selectedRowKeys.length,
      totalCount,
      currentPageCount: pageData.length,
      selectedPercent:
        totalCount > 0
          ? Math.round((selectedRowKeys.length / totalCount) * 100)
          : 0,
    }),
    [selectedRowKeys.length, totalCount, pageData.length],
  );

  // 计算状态
  const state: RowSelectionState<RecordType> = useMemo(() => {
    const isAllSelected =
      pageData.length > 0 &&
      pageData.every((record) => selectedRowKeys.includes(getRowKey(record)));
    const isIndeterminate = selectedRowKeys.length > 0 && !isAllSelected;

    return {
      selectedRowKeys,
      selectedRows: selectedRowKeys
        .map((key) => selectedRowsCache.current.get(key))
        .filter(Boolean) as RecordType[],
      indeterminateKeys: [], // TODO: 实现树形结构的半选状态
      allSelectedKeys: config.checkCrossPage
        ? allSelectedKeys
        : selectedRowKeys,
      isAllSelected,
      isIndeterminate,
      selectionStat,
      selectionCache: selectedRowsCache.current,
    };
  }, [
    selectedRowKeys,
    allSelectedKeys,
    pageData,
    getRowKey,
    config.checkCrossPage,
    selectionStat,
  ]);

  // 选择行
  interface SelectRowParams {
    key: Key;
    selected: boolean;
  }

  const selectRow = useCallback(
    ({ key, selected }: SelectRowParams) => {
      setSelectedRowKeys((prev) => {
        let newKeys: Key[];
        if (selected) {
          // 检查最大选择数量限制
          if (config.maxSelection && prev.length >= config.maxSelection) {
            devLog.warn({
              component: 'RowSelection',
              message: 'Maximum selection limit reached',
              data: {
                max: config.maxSelection,
              },
            });
            return prev;
          }
          newKeys = [...prev, key];
        } else {
          newKeys = prev.filter((k) => k !== key);
        }

        // 跨页保持选择
        if (config.checkCrossPage) {
          setAllSelectedKeys((prevAll) =>
            selected ? [...prevAll, key] : prevAll.filter((k) => k !== key),
          );
        }

        return newKeys;
      });
    },
    [config.maxSelection, config.checkCrossPage],
  );

  // 全选/取消全选
  const selectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        const pageKeys = pageData.map(getRowKey);

        // 检查最大选择数量限制
        if (config.maxSelection) {
          const availableSlots = config.maxSelection - selectedRowKeys.length;
          if (availableSlots <= 0) {
            devLog.warn({
              component: 'RowSelection',
              message: 'Cannot select all: maximum selection limit reached',
            });
            return;
          }
          const keysToAdd = pageKeys.slice(0, availableSlots);
          setSelectedRowKeys((prev) => [
            ...prev,
            ...keysToAdd.filter((key) => !prev.includes(key)),
          ]);
        } else {
          setSelectedRowKeys((prev) => [...new Set([...prev, ...pageKeys])]);
        }

        // 跨页保持选择
        if (config.checkCrossPage) {
          setAllSelectedKeys((prev) => [...new Set([...prev, ...pageKeys])]);
        }
      } else {
        const pageKeys = pageData.map(getRowKey);
        setSelectedRowKeys((prev) =>
          prev.filter((key) => !pageKeys.includes(key)),
        );

        if (config.checkCrossPage) {
          setAllSelectedKeys((prev) =>
            prev.filter((key) => !pageKeys.includes(key)),
          );
        }
      }
    },
    [
      pageData,
      getRowKey,
      selectedRowKeys,
      config.maxSelection,
      config.checkCrossPage,
    ],
  );

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedRowKeys([]);
    setAllSelectedKeys([]);
    selectedRowsCache.current.clear();
  }, []);

  // 获取选中的行数据
  const getSelectedRows = useCallback(
    () => state.selectedRows,
    [state.selectedRows],
  );

  // 是否选中指定行
  const isRowSelected = useCallback(
    (key: Key) => selectedRowKeys.includes(key),
    [selectedRowKeys],
  );

  // 执行批量操作
  const executeBatchAction = useCallback(
    async (action: BatchActionConfig<RecordType>) => {
      const selectedRows = getSelectedRows();

      // 执行前确认
      const shouldExecute = await config.beforeBatchAction?.(
        action,
        selectedRows,
      );
      if (shouldExecute === false) {
        return;
      }

      try {
        await action.handler(selectedRowKeys, selectedRows);
        devLog.log({
          component: 'RowSelection',
          message: 'Batch action executed successfully',
          data: {
            action: action.key,
            count: selectedRows.length,
          },
        });
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        devLog.error({
          component: 'RowSelection',
          message: 'Batch action failed',
          data: {
            action: action.key,
            error: errorObj.message,
            errorObj,
          },
        });
        throw errorObj;
      }
    },
    [selectedRowKeys, getSelectedRows, config.beforeBatchAction],
  );

  // 选择变化回调
  useEffect(() => {
    config.onChange?.(selectedRowKeys, state.selectedRows);
  }, [selectedRowKeys, state.selectedRows, config.onChange]);

  // Arco Table 的 rowSelection 配置
  const rowSelectionProps = useMemo(
    () => ({
      type: config.type,
      selectedRowKeys,
      onSelect: (record: RecordType, selected: boolean) => {
        const key = getRowKey(record);
        selectRow({ key, selected });
        config.onSelect?.(selected, record, state.selectedRows);
      },
      onSelectAll: (
        selected: boolean,
        selectedRows: RecordType[],
        _changeRows: RecordType[],
      ) => {
        selectAll(selected);
        config.onSelectAll?.(selected, selectedRows);
      },
      checkboxProps: config.maxSelection
        ? (record: RecordType) => ({
            disabled:
              !isRowSelected(getRowKey(record)) &&
              selectedRowKeys.length >= (config.maxSelection || 0),
            ...config.checkboxProps?.(record),
          })
        : config.checkboxProps,
      checkAll: config.checkAll,
      checkStrictly: config.checkStrictly,
      checkCrossPage: config.checkCrossPage,
      columnTitle: config.columnTitle,
      columnWidth: config.columnWidth,
      fixed: config.fixed,
      preserveSelectedRowKeys: config.preserveSelectedRowKeys,
      renderCell: config.renderCell,
    }),
    [
      config,
      selectedRowKeys,
      selectRow,
      selectAll,
      getRowKey,
      isRowSelected,
      state.selectedRows,
    ],
  );

  return {
    state,
    selectRow,
    selectAll,
    clearSelection,
    getSelectedRows,
    isRowSelected,
    executeBatchAction,
    rowSelectionProps,
  };
};
