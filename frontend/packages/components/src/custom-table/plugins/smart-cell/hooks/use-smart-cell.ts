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
  CellRenderParams,
  EmptyValueConfig,
  EmptyValueContext,
  SmartCellConfig,
  SmartCellMethods,
  SmartCellState,
  UserRole,
} from '@/custom-table/types';
import { devLog } from '@/custom-table/utils';
/**
 * 智能单元格 Hook
 * 基于 EPS 平台的智能空值处理
 */
import React, { useMemo, useCallback } from 'react';

export interface UseSmartCellOptions<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 表格数据 */
  data: RecordType[];
  /** 配置 */
  config: SmartCellConfig;
  /** 用户角色 */
  userRole?: UserRole;
  /** 获取上下文信息 */
  getContext?: (params: {
    record: RecordType;
    field: string;
  }) => EmptyValueContext;
}

export interface UseSmartCellReturn<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 当前状态 */
  state: SmartCellState;
  /** 智能单元格方法 */
  methods: SmartCellMethods<RecordType>;
  /** 获取字段配置 */
  getFieldConfig: (field: string) => EmptyValueConfig;
  /** 渲染智能单元格 */
  renderSmartCell: (params: CellRenderParams<RecordType>) => React.ReactElement;
  /** 判断是否为空值 */
  isEmpty: (value: unknown) => boolean;
  /** 获取上下文信息 */
  getContextInfo: (params: {
    record: RecordType;
    field: string;
  }) => EmptyValueContext;
}

export const useSmartCell = <RecordType extends BaseRecord = BaseRecord>({
  data,
  config,
  userRole = 'viewer',
  getContext,
}: UseSmartCellOptions<RecordType>): UseSmartCellReturn<RecordType> => {
  // 计算状态
  const state: SmartCellState = useMemo(() => {
    const emptyFields = new Set<string>();
    const fieldStats = new Map<string, { total: number; empty: number }>();

    data.forEach((record) => {
      Object.keys(record as Record<string, unknown>).forEach((field) => {
        const value = (record as Record<string, unknown>)[field];
        const isEmpty = isEmptyValue(value);

        if (isEmpty) {
          emptyFields.add(field);
        }

        const currentStat = fieldStats.get(field) || { total: 0, empty: 0 };
        fieldStats.set(field, {
          total: currentStat.total + 1,
          empty: currentStat.empty + (isEmpty ? 1 : 0),
        });
      });
    });

    return {
      emptyFields,
      fieldStats,
      totalRows: data.length,
      userRole,
      currentUserRole: userRole,
      fieldPermissions: new Map(),
      emptyValueStats: {
        totalEmptyCount: 0,
        fieldEmptyCounts: {},
        interactiveEmptyCount: 0,
      },
    };
  }, [data, userRole]);

  // 判断是否为空值
  const isEmptyValue = useCallback((value: unknown): boolean => {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return true;
    }
    if (Array.isArray(value) && value.length === 0) {
      return true;
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return true;
    }
    return false;
  }, []);

  // 获取字段配置
  const getFieldConfig = useCallback(
    (field: string): EmptyValueConfig => {
      const fieldConfig = config.fieldConfigs?.[field];
      if (fieldConfig) {
        return { ...config.defaultEmptyConfig, ...fieldConfig };
      }
      return (
        config.defaultEmptyConfig || {
          strategy: 'text',
          text: '--',
          showTooltip: false,
          allowEdit: false,
        }
      );
    },
    [config],
  );

  // 获取上下文信息
  const getContextInfo = useCallback(
    ({
      record,
      field,
    }: { record: RecordType; field: string }): EmptyValueContext => {
      if (getContext) {
        return getContext({ record, field });
      }

      // 默认上下文信息
      const fieldStat = state.fieldStats?.get(field);
      const emptyRate = fieldStat ? fieldStat.empty / fieldStat.total : 0;

      return {
        fieldName: field,
        dataSize: (() => {
          if (data.length > 1000) {
            return 'large';
          }
          if (data.length > 100) {
            return 'medium';
          }
          return 'small';
        })(),
        hasRelatedData: false, // 需要业务逻辑判断
        isRequired: false, // 需要字段配置判断
        emptyRate,
        rowIndex: data.findIndex((item) => item === record),
      };
    },
    [data, state.fieldStats, getContext],
  );

  // 处理空值点击
  const handleEmptyValueClick = useCallback(
    (params: CellRenderParams<RecordType>) => {
      const { field, record } = params;

      devLog.log({
        component: 'SmartCell',
        message: 'Empty value clicked',
        data: {
          field,
          userRole,
          recordId: (record as Record<string, unknown>).id,
        },
      });

      // 触发配置的回调
      if (config.onEmptyValueClick) {
        config.onEmptyValueClick(params as unknown as Record<string, unknown>);
      }

      // 触发字段特定的回调
      const fieldConfig = getFieldConfig(field);
      if (fieldConfig.onClick) {
        fieldConfig.onClick(params as unknown as Record<string, unknown>);
      }
    },
    [config, userRole, getFieldConfig],
  );

  // 渲染智能单元格
  const renderSmartCell = useCallback(
    (params: CellRenderParams<RecordType>): React.ReactElement => {
      const { record, field } = params;
      const fieldConfig = getFieldConfig(field);
      const contextInfo = getContextInfo({ record, field });

      // 如果单元格渲染被配置覆盖
      if (config.onCellRender) {
        const customRender = config.onCellRender(
          params,
          fieldConfig,
          contextInfo,
        );
        if (customRender !== undefined) {
          return customRender as React.ReactElement;
        }
      }

      // 占位返回，真实渲染由上层组件完成
      return React.createElement(React.Fragment);
    },
    [config, getFieldConfig, getContextInfo],
  );

  // 智能单元格方法
  const methods: SmartCellMethods<RecordType> = useMemo(
    () => ({
      renderSmartCell: (params: CellRenderParams<RecordType>) =>
        renderSmartCell(params) as unknown as React.ReactElement,
      checkFieldPermission: (_fieldName: string, _record: RecordType) =>
        // 简单的权限检查逻辑
        true,
      checkEditPermission: (_fieldName: string, _record: RecordType) =>
        // 简单的编辑权限检查逻辑
        true,
      getEmptyConfig: getFieldConfig,
      handleEmptyClick: (_fieldName: string, record: RecordType) => {
        const params: CellRenderParams<RecordType> = {
          value: (record as unknown as Record<string, unknown>)[_fieldName],
          record,
          field: _fieldName,
        };
        handleEmptyValueClick(params);
      },
      updateUserRole: (role: UserRole) => {
        // 更新用户角色的逻辑
        config.userRole = role;
      },
      getEmptyStats: () => ({
        totalEmptyCount: 0,
        fieldEmptyCounts: {},
        interactiveEmptyCount: 0,
      }),
    }),
    [renderSmartCell, getFieldConfig, handleEmptyValueClick, config],
  );

  return {
    state,
    methods,
    getFieldConfig,
    renderSmartCell,
    isEmpty: isEmptyValue,
    getContextInfo,
  };
};
