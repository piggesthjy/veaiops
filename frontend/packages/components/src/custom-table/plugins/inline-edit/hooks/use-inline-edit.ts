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
  EditState,
  EditingCellInfo,
  FieldEditConfig,
  GetEditingErrorsParams,
  GetEditingValueParams,
  InlineEditMethods,
  IsEditingParams,
  SetEditingValueParams,
  StartEditParams,
} from '@/custom-table/types';
import { devLog } from '@/custom-table/utils';
import { Message } from '@arco-design/web-react';
/**
 * 行内编辑 Hook
 * 基于 EPS 平台的可编辑表格功能
 */
import { type Key, useCallback, useMemo, useRef, useState } from 'react';

export interface UseInlineEditOptions<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 表格数据 */
  data: RecordType[];
  /** 配置 */
  config: any;
  /** 获取行 key 的函数 */
  getRowKey: (record: RecordType) => Key;
  /** 数据更新函数 */
  onDataChange: (newData: RecordType[]) => void;
}

export interface ValidateFieldParams<RecordType extends BaseRecord> {
  field: string;
  value: unknown;
  record: RecordType;
}

export interface GetCellKeyParams {
  rowKey: Key;
  field: string;
}

export interface UseInlineEditReturn<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 当前编辑状态 */
  state: any;
  /** 编辑方法 */
  methods: any;
  /** 开始编辑单元格 */
  startEdit: (params: StartEditParams) => void;
  /** 完成编辑 */
  finishEdit: (value: unknown) => Promise<void>;
  /** 取消编辑 */
  cancelEdit: () => void;
  /** 批量开始编辑 */
  startBatchEdit: (rowKeys: Key[]) => void;
  /** 是否正在编辑 */
  isEditing: (params: IsEditingParams) => boolean;
  /** 获取字段编辑配置 */
  getFieldEditConfig: (field: string) => FieldEditConfig<RecordType> | null;
}

export const useInlineEdit = <RecordType extends BaseRecord = BaseRecord>({
  data,
  config,
  getRowKey,
  onDataChange,
}: UseInlineEditOptions<RecordType>): UseInlineEditReturn<RecordType> => {
  // 编辑状态
  const [editingCells, setEditingCells] = useState<
    Map<string, EditingCellInfo<RecordType>>
  >(new Map());
  const [editingRows, setEditingRows] = useState<Set<Key>>(new Set());
  const [originalValues, setOriginalValues] = useState<Map<string, unknown>>(
    new Map(),
  );
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(
    new Map(),
  );

  // 引用
  const dataRef = useRef(data);
  dataRef.current = data;

  // 生成单元格 key
  const getCellKey = useCallback(
    ({ rowKey, field }: GetCellKeyParams) => `${rowKey}:${field}`,
    [],
  );

  // 计算编辑状态
  const state: EditState<RecordType> = useMemo(
    () => ({
      editingCells: new Map(editingCells),
      editingRows: new Set(editingRows),
      originalValues: new Map(originalValues),
      validationErrors: new Map(validationErrors),
      hasChanges: editingCells.size > 0,
      isAnyEditing: editingCells.size > 0 || editingRows.size > 0,
      editingValues: new Map(), // 添加缺失的属性
      editingErrors: new Map(),
      hasUnsavedChanges: editingCells.size > 0,
      validationState: new Map(),
    }),
    [editingCells, editingRows, originalValues, validationErrors],
  );

  // 获取字段编辑配置
  const getFieldEditConfig = useCallback(
    (field: string): FieldEditConfig<RecordType> | null =>
      config.fields?.find(
        (f: FieldEditConfig<RecordType>) => f.dataIndex === field,
      ) || null,
    [config.fields],
  );

  // 验证字段值
  const validateField = useCallback(
    async ({
      field,
      value,
      record,
    }: ValidateFieldParams<RecordType>): Promise<string | null> => {
      const fieldConfig = getFieldEditConfig(field);
      if (!fieldConfig?.validate) {
        return null;
      }

      try {
        const result = await fieldConfig.validate(value, record);
        return typeof result === 'string' ? result : null;
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        // ✅ 正确：透出实际错误信息
        const errorMessage =
          error instanceof Error ? error.message : '验证失败';
        devLog.error({
          component: 'InlineEdit',
          message: 'Field validation error',
          data: {
            field,
            error: errorObj.message,
            errorObj,
          },
        });
        return errorMessage || '验证失败';
      }
    },
    [getFieldEditConfig],
  );

  // 开始编辑单元格
  const startEdit = useCallback(
    async ({ rowKey, field }: StartEditParams) => {
      const fieldConfig = getFieldEditConfig(field);
      if (!fieldConfig || fieldConfig.disabled || fieldConfig.readOnly) {
        return;
      }

      const record = dataRef.current.find((item) => getRowKey(item) === rowKey);
      if (!record) {
        devLog.warn({
          component: 'InlineEdit',
          message: 'Record not found for editing',
          data: {
            rowKey,
            field,
          },
        });
        return;
      }

      // 执行编辑前回调
      if (config.onBeforeEdit) {
        const shouldContinue = await config.onBeforeEdit(field, record);
        if (shouldContinue === false) {
          return;
        }
      }

      const cellKey = getCellKey({ rowKey, field });
      const currentValue = (record as Record<string, unknown>)[field];

      // 保存原始值
      setOriginalValues((prev) => new Map(prev.set(cellKey, currentValue)));

      // 设置编辑状态
      const editingInfo: EditingCellInfo<RecordType> = {
        rowKey,
        field,
        fieldName: field,
        rowIndex: 0, // TODO: 从外部传入正确的行索引
        columnIndex: 0, // TODO: 从外部传入正确的列索引
        record,
        originalValue: currentValue,
        currentValue,
      };

      setEditingCells((prev) => new Map(prev.set(cellKey, editingInfo)));

      if (config.mode === 'row') {
        setEditingRows((prev) => new Set(prev.add(rowKey)));
      }

      devLog.log({
        component: 'InlineEdit',
        message: 'Started editing cell',
        data: { rowKey, field },
      });
    },
    [config, getFieldEditConfig, getRowKey, getCellKey],
  );

  // 完成编辑
  const finishEdit = useCallback(
    async (value: unknown) => {
      const editingArray = Array.from(editingCells.values());
      if (editingArray.length === 0) {
        return;
      }

      const currentCell = editingArray[editingArray.length - 1]; // 取最后一个编辑的单元格
      const { rowKey, field, record } = currentCell;
      const cellKey = getCellKey({ rowKey, field });

      try {
        // 验证
        if (config.validateOnChange) {
          const error = await validateField({ field, value, record });
          if (error) {
            setValidationErrors((prev) => new Map(prev.set(cellKey, error)));
            if (config.onValidationError) {
              config.onValidationError(field, error, record);
            }
            return;
          }
          setValidationErrors((prev) => {
            const newMap = new Map(prev);
            newMap.delete(cellKey);
            return newMap;
          });
        }

        // 更新数据
        const newData = dataRef.current.map((item) => {
          if (getRowKey(item) === rowKey) {
            return {
              ...(item as Record<string, unknown>),
              [field]: value,
            } as RecordType;
          }
          return item;
        });

        onDataChange(newData);

        // 自动保存
        if (config.autoSave && config.onSave) {
          await config.onSave(field, value, record);
        }

        // 清除编辑状态
        setEditingCells((prev) => {
          const newMap = new Map(prev);
          newMap.delete(cellKey);
          return newMap;
        });

        setOriginalValues((prev) => {
          const newMap = new Map(prev);
          newMap.delete(cellKey);
          return newMap;
        });

        if (config.mode === 'row' && editingCells.size === 1) {
          setEditingRows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(rowKey);
            return newSet;
          });
        }

        // 执行编辑后回调
        if (config.onAfterEdit) {
          config.onAfterEdit(field, value, record);
        }

        devLog.log({
          component: 'InlineEdit',
          message: 'Finished editing cell',
          data: {
            rowKey,
            field,
            value,
          },
        });
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        // ✅ 正确：透出实际错误信息
        const errorMessage =
          error instanceof Error ? error.message : '保存失败';
        devLog.error({
          component: 'InlineEdit',
          message: 'Failed to finish editing',
          data: {
            rowKey,
            field,
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
            errorMessage,
          },
        });
        Message.error(errorMessage);
      }
    },
    [editingCells, config, validateField, getRowKey, getCellKey, onDataChange],
  );

  // 取消编辑
  const cancelEdit = useCallback(() => {
    const editingArray = Array.from(editingCells.values());
    if (editingArray.length === 0) {
      return;
    }

    const currentCell = editingArray[editingArray.length - 1];
    const { rowKey, field, record } = currentCell;
    const cellKey = getCellKey({ rowKey, field });

    // 清除编辑状态
    setEditingCells((prev) => {
      const newMap = new Map(prev);
      newMap.delete(cellKey);
      return newMap;
    });

    setOriginalValues((prev) => {
      const newMap = new Map(prev);
      newMap.delete(cellKey);
      return newMap;
    });

    setValidationErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(cellKey);
      return newMap;
    });

    if (config.mode === 'row' && editingCells.size === 1) {
      setEditingRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rowKey);
        return newSet;
      });
    }

    // 执行取消回调
    if (config.onEditCancel) {
      config.onEditCancel(field, record);
    }

    devLog.log({
      component: 'InlineEdit',
      message: 'Cancelled editing cell',
      data: { rowKey, field },
    });
  }, [editingCells, config, getCellKey]);

  // 批量开始编辑
  const startBatchEdit = useCallback(
    async (rowKeys: Key[]) => {
      if (!config.allowBatchEdit) {
        // ✅ 正确：使用 devLog 记录警告，传递完整的上下文信息
        devLog.warn({
          component: 'InlineEdit',
          message: 'Batch edit not allowed',
          data: {
            rowKeys,
            allowBatchEdit: config.allowBatchEdit,
          },
        });
        return;
      }

      for (const rowKey of rowKeys) {
        setEditingRows((prev) => new Set(prev.add(rowKey)));
      }

      devLog.log({
        component: 'InlineEdit',
        message: 'Started batch editing',
        data: { rowKeys },
      });
    },
    [config.allowBatchEdit],
  );

  // 检查是否正在编辑
  const isEditing = useCallback(
    ({ rowKey, field }: IsEditingParams) => {
      if (field) {
        return editingCells.has(getCellKey({ rowKey, field }));
      }
      return editingRows.has(rowKey);
    },
    [editingCells, editingRows, getCellKey],
  );

  // 编辑方法
  const methods: InlineEditMethods<RecordType> = useMemo(
    () => ({
      startEdit,
      finishEdit,
      cancelEdit,
      startRowEdit: async (_rowKey: Key) => {
        // TODO: 实现行编辑
      },
      finishRowEdit: async (_rowKey: Key) =>
        // TODO: 实现行编辑完成
        true,
      cancelRowEdit: (_rowKey: Key) => {
        // TODO: 实现取消行编辑
      },
      saveAll: async () =>
        // TODO: 实现保存所有编辑
        true,
      cancelAll: () => {
        // TODO: 实现取消所有编辑
      },
      validate: async (params?: GetEditingErrorsParams) => {
        // TODO: 实现验证
        return true;
      },
      getEditingValue: ({ rowKey, field }: GetEditingValueParams) => {
        const cellKey = getCellKey({ rowKey, field });
        return editingCells.get(cellKey)?.currentValue;
      },
      setEditingValue: ({ rowKey, field, value }: SetEditingValueParams) => {
        const cellKey = getCellKey({ rowKey, field });
        const existing = editingCells.get(cellKey);
        if (existing) {
          existing.currentValue = value;
          setEditingCells((prev) => new Map(prev.set(cellKey, existing)));
        }
      },
      isEditing,
      getEditingData: () => {
        const result = new Map<Key, Partial<RecordType>>();
        editingCells.forEach((cellInfo, _cellKey) => {
          const existingData =
            result.get(cellInfo.rowKey) || ({} as Partial<RecordType>);
          (existingData as Record<string, unknown>)[cellInfo.field] =
            cellInfo.currentValue;
          result.set(cellInfo.rowKey, existingData);
        });
        return result;
      },
      getEditingErrors: ({ rowKey, field }: GetEditingErrorsParams = {}) => {
        if (rowKey && field) {
          const cellKey = getCellKey({ rowKey, field });
          const error = validationErrors.get(cellKey);
          return error ? [error] : [];
        }
        return Array.from(validationErrors.values());
      },
      startBatchEdit,
      getFieldEditConfig,
    }),
    [
      startEdit,
      finishEdit,
      cancelEdit,
      startBatchEdit,
      isEditing,
      getFieldEditConfig,
      validateField,
      editingCells,
      validationErrors,
      getCellKey,
    ],
  );

  return {
    state,
    methods,
    startEdit,
    finishEdit,
    cancelEdit,
    startBatchEdit,
    isEditing,
    getFieldEditConfig,
  };
};
