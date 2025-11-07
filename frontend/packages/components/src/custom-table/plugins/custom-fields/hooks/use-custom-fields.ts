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
 * Custom Fields Hook
 */
import type { BaseRecord, ModernTableColumnProps } from '@/custom-table/types';
import { useCallback, useMemo, useState } from 'react';
import type { CustomFieldsState } from '../types';

export interface UseCustomFieldsOptions<T extends BaseRecord = BaseRecord> {
  /** 初始选中的字段 */
  initialFields?: string[];
  /** 所有可用的列 */
  columns: ModernTableColumnProps<T>[];
  /** 禁用的字段 */
  disabledFields?: Map<string, string | undefined>;
  /** 字段变化回调 */
  onFieldsChange?: (fields: string[]) => void;
}

export interface UseCustomFieldsReturn<T extends BaseRecord = BaseRecord> {
  /** 当前状态 */
  state: CustomFieldsState<T>;
  /** 设置选中的字段 */
  setSelectedFields: (fields: string[]) => void;
  /** 切换字段状态 */
  toggleField: (field: string) => void;
  /** 重置到初始状态 */
  reset: () => void;
  /** 获取所有可用字段 */
  getAllAvailableFields: () => string[];
}

export const useCustomFields = <T extends BaseRecord = BaseRecord>({
  initialFields = [],
  columns,
  disabledFields = new Map(),
  onFieldsChange,
}: UseCustomFieldsOptions<T>): UseCustomFieldsReturn<T> => {
  const [selectedFields, setSelectedFieldsState] =
    useState<string[]>(initialFields);

  /**
   * 递归获取所有字段
   */
  const getAllFields = useCallback(
    (columns: ModernTableColumnProps<T>[]): string[] => {
      const fields: string[] = [];
      columns.forEach((column) => {
        if (column.dataIndex) {
          fields.push(column.dataIndex);
        }
        if (column.children) {
          fields.push(...getAllFields(column.children));
        }
      });
      return fields;
    },
    [],
  );

  /**
   * 获取所有可用字段（排除禁用的）
   */
  const getAllAvailableFields = useCallback(() => {
    const allFields = getAllFields(columns);
    return allFields.filter((field) => !disabledFields.has(field));
  }, [columns, disabledFields, getAllFields]);

  /**
   * 可用的列
   */
  const availableColumns = useMemo(
    () =>
      columns.filter(
        (column) => !column.dataIndex || !disabledFields.has(column.dataIndex),
      ),
    [columns, disabledFields],
  );

  /**
   * 设置选中字段
   */
  const setSelectedFields = useCallback(
    (fields: string[]) => {
      setSelectedFieldsState(fields);
      onFieldsChange?.(fields);
    },
    [onFieldsChange],
  );

  /**
   * 切换字段状态
   */
  const toggleField = useCallback((field: string) => {
    setSelectedFieldsState((prev: string[]) => {
      if (prev.includes(field)) {
        return prev.filter((f: string) => f !== field);
      } else {
        return [...prev, field];
      }
    });
  }, []);

  /**
   * 重置到初始状态
   */
  const reset = useCallback(() => {
    setSelectedFields(initialFields);
  }, [initialFields, setSelectedFields]);

  /**
   * 当前状态
   */
  const state: CustomFieldsState<T> = useMemo(
    () => ({
      showCustomFields: true,
      selectedFields,
      availableColumns,
      disabledFields: Array.from(disabledFields.keys()),
    }),
    [selectedFields, availableColumns, disabledFields],
  );

  return {
    state,
    setSelectedFields,
    toggleField,
    reset,
    getAllAvailableFields,
  };
};
