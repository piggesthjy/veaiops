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
 * 列宽持久化核心Hook
 *

 *
 */

import type {
  ColumnWidthPersistenceConfig,
  ColumnWidthPersistenceMethods,
  ColumnWidthPersistenceState,
} from '@/custom-table/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_COLUMN_WIDTH_PERSISTENCE_CONFIG } from '../config';
import {
  compareColumnWidths,
  createDebouncedWidthDetector,
  detectAllColumnWidthsFromDOM,
  filterValidColumnWidths,
  generateStorageKey,
  localStorageUtils,
  validateColumnWidth,
} from '../utils';

/**
 * 列宽持久化Hook参数
 */
export interface UseColumnWidthPersistenceProps {
  /** 插件配置 */
  config?: ColumnWidthPersistenceConfig;
  /** 表格ID，用于区分不同表格的存储 */
  tableId?: string;
  /** 当前列配置 */
  columns?: Array<{ dataIndex: string; width?: number | string }>;
  /** 表格容器引用 */
  tableContainerRef?: React.RefObject<HTMLElement>;
  /** 列宽变化回调 */
  onColumnWidthChange?: (dataIndex: string, width: number) => void;
  /** 批量列宽变化回调 */
  onBatchColumnWidthChange?: (widthsMap: Record<string, number>) => void;
}

/**
 * 列宽持久化Hook返回值
 */
export interface UseColumnWidthPersistenceResult
  extends ColumnWidthPersistenceMethods {
  /** 插件状态 */
  state: ColumnWidthPersistenceState;
  /** 当前持久化的列宽映射 */
  persistentWidths: Record<string, number>;
  /** 是否正在检测中 */
  isDetecting: boolean;
}

/**
 * 列宽持久化核心Hook
 */
export const useColumnWidthPersistence = ({
  config = {},
  tableId = 'default',
  columns = [],
  tableContainerRef,
  onColumnWidthChange,
  onBatchColumnWidthChange,
}: UseColumnWidthPersistenceProps): UseColumnWidthPersistenceResult => {
  // 合并配置
  const finalConfig = { ...DEFAULT_COLUMN_WIDTH_PERSISTENCE_CONFIG, ...config };

  // 基础状态
  const [state, setState] = useState<ColumnWidthPersistenceState>({
    persistentWidths: {},
    isDetecting: false,
    lastDetectionTime: 0,
    widthHistory: [],
  });

  // 引用
  const detectionTimerRef = useRef<NodeJS.Timeout>();
  const lastWidthsRef = useRef<Record<string, number>>({});
  const storageKeyRef = useRef<string>(
    generateStorageKey({
      prefix: finalConfig.storageKeyPrefix,
      tableId,
    }),
  );

  // 获取当前列的dataIndex列表
  const dataIndexList = columns.map((col) => col.dataIndex).filter(Boolean);

  /**
   * 设置单个列的持久化宽度（内部实现）
   */
  const setPersistentColumnWidthImpl = useCallback(
    ({ dataIndex, width }: { dataIndex: string; width: number }) => {
      const validatedWidth = validateColumnWidth({
        width,
        config: finalConfig,
      });

      setState((prev: ColumnWidthPersistenceState) => ({
        ...prev,
        persistentWidths: {
          ...prev.persistentWidths,
          [dataIndex]: validatedWidth,
        },
      }));

      // 触发回调
      onColumnWidthChange?.(dataIndex, validatedWidth);

      // 保存到本地存储
      if (finalConfig.enableLocalStorage && localStorageUtils.isAvailable()) {
        const currentWidths = {
          ...state.persistentWidths,
          [dataIndex]: validatedWidth,
        };
        localStorageUtils.save(storageKeyRef.current, currentWidths);
      }
    },
    [finalConfig, onColumnWidthChange, state.persistentWidths],
  );

  /**
   * 批量设置持久化列宽度
   */
  const setBatchPersistentColumnWidths = useCallback(
    (widthsMap: Record<string, number>) => {
      const validatedWidths = filterValidColumnWidths({
        widths: widthsMap,
        config: finalConfig,
      });

      setState((prev: ColumnWidthPersistenceState) => ({
        ...prev,
        persistentWidths: {
          ...prev.persistentWidths,
          ...validatedWidths,
        },
      }));

      // 触发回调
      onBatchColumnWidthChange?.(validatedWidths);

      // 保存到本地存储
      if (finalConfig.enableLocalStorage && localStorageUtils.isAvailable()) {
        const currentWidths = {
          ...state.persistentWidths,
          ...validatedWidths,
        };
        localStorageUtils.save(storageKeyRef.current, currentWidths);
      }
    },
    [finalConfig, onBatchColumnWidthChange, state.persistentWidths],
  );

  /**
   * 获取持久化列宽度
   */
  const getPersistentColumnWidth = useCallback(
    (dataIndex: string): number | undefined =>
      state.persistentWidths[dataIndex],
    [state.persistentWidths],
  );

  /**
   * 获取所有持久化列宽度
   */
  const getAllPersistentColumnWidths = useCallback(
    (): Record<string, number> => ({ ...state.persistentWidths }),
    [state.persistentWidths],
  );

  /**
   * 清除特定列的持久化宽度
   */
  const clearPersistentColumnWidth = useCallback(
    (dataIndex: string) => {
      setState((prev: ColumnWidthPersistenceState) => {
        const { [dataIndex]: _, ...rest } = prev.persistentWidths;
        return {
          ...prev,
          persistentWidths: rest,
        };
      });

      // 更新本地存储
      if (finalConfig.enableLocalStorage && localStorageUtils.isAvailable()) {
        const { [dataIndex]: _, ...rest } = state.persistentWidths;
        localStorageUtils.save(storageKeyRef.current, rest);
      }
    },
    [finalConfig.enableLocalStorage, state.persistentWidths],
  );

  /**
   * 清除所有持久化列宽度
   */
  const clearAllPersistentColumnWidths = useCallback(() => {
    setState((prev: ColumnWidthPersistenceState) => ({
      ...prev,
      persistentWidths: {},
    }));

    // 清除本地存储
    if (finalConfig.enableLocalStorage && localStorageUtils.isAvailable()) {
      localStorageUtils.remove(storageKeyRef.current);
    }
  }, [finalConfig.enableLocalStorage]);

  /**
   * 从DOM检测当前列宽度
   */
  const detectCurrentColumnWidths = useCallback(async (): Promise<
    Record<string, number>
  > => {
    if (!tableContainerRef?.current) {
      return {};
    }

    setState((prev: ColumnWidthPersistenceState) => ({
      ...prev,
      isDetecting: true,
    }));

    try {
      const detectedWidths = detectAllColumnWidthsFromDOM({
        tableContainer: tableContainerRef.current,
        dataIndexList,
      });

      setState((prev: ColumnWidthPersistenceState) => ({
        ...prev,
        isDetecting: false,
        lastDetectionTime: Date.now(),
      }));

      return detectedWidths;
    } catch (error) {
      // 检测列宽失败，重置状态并返回空对象
      setState((prev: ColumnWidthPersistenceState) => ({
        ...prev,
        isDetecting: false,
      }));
      return {};
    }
  }, [tableContainerRef, dataIndexList]);

  /**
   * 保存当前列宽度到持久化存储
   */
  const saveCurrentColumnWidths = useCallback(async () => {
    const currentWidths = await detectCurrentColumnWidths();
    if (Object.keys(currentWidths).length > 0) {
      setBatchPersistentColumnWidths(currentWidths);
    }
  }, [detectCurrentColumnWidths, setBatchPersistentColumnWidths]);

  /**
   * 从持久化存储恢复列宽度
   */
  const restoreColumnWidths = useCallback(async () => {
    if (!finalConfig.enableLocalStorage || !localStorageUtils.isAvailable()) {
      return;
    }

    const savedWidths = localStorageUtils.load<Record<string, number>>(
      storageKeyRef.current,
    );
    if (savedWidths && Object.keys(savedWidths).length > 0) {
      setState((prev: ColumnWidthPersistenceState) => ({
        ...prev,
        persistentWidths: savedWidths,
      }));
    }
  }, [finalConfig.enableLocalStorage]);

  /**
   * 应用列宽度到表格
   */
  const applyColumnWidths = useCallback(
    (widthsMap: Record<string, number>) => {
      setBatchPersistentColumnWidths(widthsMap);
    },
    [setBatchPersistentColumnWidths],
  );

  // 创建防抖的自动检测函数
  const debouncedDetection = useCallback(
    createDebouncedWidthDetector({
      detectFunction: async () => {
        if (!finalConfig.enableAutoDetection || !tableContainerRef?.current) {
          return;
        }

        const currentWidths = await detectCurrentColumnWidths();

        // 只有当宽度发生变化时才更新
        if (
          !compareColumnWidths({
            widths1: currentWidths,
            widths2: lastWidthsRef.current,
          })
        ) {
          lastWidthsRef.current = currentWidths;
          setBatchPersistentColumnWidths(currentWidths);
        }
      },
      delay: finalConfig.detectionDelay,
    }),
    [
      finalConfig.enableAutoDetection,
      finalConfig.detectionDelay,
      tableContainerRef,
      detectCurrentColumnWidths,
      setBatchPersistentColumnWidths,
    ],
  );

  // 监听表格容器的变化，触发自动检测
  useEffect(() => {
    if (!finalConfig.enableAutoDetection || !tableContainerRef?.current) {
      return undefined;
    }

    const container = tableContainerRef.current;
    const observer = new ResizeObserver(() => {
      debouncedDetection();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [finalConfig.enableAutoDetection, tableContainerRef, debouncedDetection]);

  // 初始化时恢复列宽度
  useEffect(() => {
    restoreColumnWidths();
  }, [restoreColumnWidths]);

  // 清理定时器
  useEffect(
    () => () => {
      if (detectionTimerRef.current) {
        clearTimeout(detectionTimerRef.current);
      }
    },
    [],
  );

  // 包装 setPersistentColumnWidth 以匹配接口签名
  const wrappedSetPersistentColumnWidth: ColumnWidthPersistenceMethods['setPersistentColumnWidth'] =
    useCallback(
      (params: { dataIndex: string; width: number }) => {
        setPersistentColumnWidthImpl(params);
      },
      [setPersistentColumnWidthImpl],
    );

  return {
    // 状态
    state,
    persistentWidths: state.persistentWidths,
    isDetecting: state.isDetecting || false,

    // 方法（实现 ColumnWidthPersistenceMethods 接口）
    setPersistentColumnWidth: wrappedSetPersistentColumnWidth,
    setBatchPersistentColumnWidths,
    getPersistentColumnWidth,
    getAllPersistentColumnWidths,
    clearPersistentColumnWidth,
    clearAllPersistentColumnWidths,
    detectCurrentColumnWidths,
    saveCurrentColumnWidths,
    restoreColumnWidths,
    applyColumnWidths,
  };
};
