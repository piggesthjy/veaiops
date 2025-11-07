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

import type { CustomFilterSettingState } from '@/custom-table/types';
import { useCallback, useMemo, useState } from 'react';
/**
 * Custom Filter Setting Hook
 */

export interface UseFilterSettingOptions {
  /** 初始固定字段 */
  initialFixedFields?: string[];
  /** 初始选中字段 */
  initialSelectedFields?: string[];
  /** 初始隐藏字段 */
  initialHiddenFields?: string[];
  /** 所有可用字段 */
  allFields?: string[];
  /** 字段变化回调 */
  onFieldsChange?: (fields: {
    fixed_fields: string[];
    selected_fields: string[];
    hidden_fields: string[];
  }) => void;
}

export interface UseFilterSettingReturn {
  /** 当前状态 */
  state: CustomFilterSettingState;
  /** 设置固定字段 */
  setFixedFields: (fields: string[]) => void;
  /** 设置选中字段 */
  setSelectedFields: (fields: string[]) => void;
  /** 设置隐藏字段 */
  setHiddenFields: (fields: string[]) => void;
  /** 重置到初始状态 */
  reset: () => void;
  /** 保存配置 */
  saveConfiguration: (
    saveFun: (data: {
      fixed_fields: string[];
      selected_fields: string[];
      hidden_fields: string[];
    }) => void,
  ) => void;
}

export const useFilterSetting = ({
  initialFixedFields = [],
  initialSelectedFields = [],
  initialHiddenFields = [],
  allFields = [],
  onFieldsChange,
}: UseFilterSettingOptions): UseFilterSettingReturn => {
  const [fixedFields, setFixedFieldsState] =
    useState<string[]>(initialFixedFields);
  const [selectedFields, setSelectedFieldsState] = useState<string[]>(
    initialSelectedFields,
  );
  const [hiddenFields, setHiddenFieldsState] =
    useState<string[]>(initialHiddenFields);

  /**
   * 设置固定字段
   */
  const setFixedFields = useCallback(
    (fields: string[]) => {
      setFixedFieldsState(fields);
      onFieldsChange?.({
        fixed_fields: fields,
        selected_fields: selectedFields,
        hidden_fields: hiddenFields,
      });
    },
    [selectedFields, hiddenFields, onFieldsChange],
  );

  /**
   * 设置选中字段
   */
  const setSelectedFields = useCallback(
    (fields: string[]) => {
      setSelectedFieldsState(fields);
      onFieldsChange?.({
        fixed_fields: fixedFields,
        selected_fields: fields,
        hidden_fields: hiddenFields,
      });
    },
    [fixedFields, hiddenFields, onFieldsChange],
  );

  /**
   * 设置隐藏字段
   */
  const setHiddenFields = useCallback(
    (fields: string[]) => {
      setHiddenFieldsState(fields);
      onFieldsChange?.({
        fixed_fields: fixedFields,
        selected_fields: selectedFields,
        hidden_fields: fields,
      });
    },
    [fixedFields, selectedFields, onFieldsChange],
  );

  /**
   * 重置到初始状态
   */
  const reset = useCallback(() => {
    setFixedFields(initialFixedFields);
    setSelectedFields(initialSelectedFields);
    setHiddenFields(initialHiddenFields);
  }, [
    initialFixedFields,
    initialSelectedFields,
    initialHiddenFields,
    setFixedFields,
    setSelectedFields,
    setHiddenFields,
  ]);

  /**
   * 保存配置
   */
  const saveConfiguration = useCallback(
    (
      saveFun: (data: {
        fixed_fields: string[];
        selected_fields: string[];
        hidden_fields: string[];
      }) => void,
    ) => {
      const saveData = {
        fixed_fields: fixedFields,
        selected_fields: selectedFields,
        hidden_fields: hiddenFields,
      };
      saveFun(saveData);
    },
    [fixedFields, selectedFields, hiddenFields],
  );

  /**
   * 当前状态
   */
  const state: CustomFilterSettingState = useMemo(
    () => ({
      showFilterSetting: true,
      fixedFields,
      selectedFields,
      hiddenFields,
      allFields,
      filters: {},
      visible: true,
    }),
    [fixedFields, selectedFields, hiddenFields, allFields],
  );

  return {
    state,
    setFixedFields,
    setSelectedFields,
    setHiddenFields,
    reset,
    saveConfiguration,
  };
};
