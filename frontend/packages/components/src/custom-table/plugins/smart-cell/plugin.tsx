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

import type { BaseRecord, PluginContext } from '@/custom-table/types';
import { PluginNames } from '@/custom-table/types/constants/enum';
/**
 * 智能单元格插件
 * 基于 EPS 平台的智能空值处理能力
 */
import React from 'react';
import { SmartEmptyCell } from './components';
import { DEFAULT_SMART_CELL_CONFIG } from './config';
import { useSmartCell } from './hooks';
import type {
  CellRenderParams,
  SmartCellConfig,
  SmartCellState,
} from './types';

/**
 * 插件基础接口
 */
interface BasePlugin<ConfigType = unknown, StateType = unknown> {
  name: string;
  config: ConfigType;
  install: () => Promise<void>;
  uninstall: () => Promise<void>;
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
  getDefaultState: () => StateType;
  validate: () => { isValid: boolean; errors: string[] };
}

/**
 * 智能单元格插件类
 */
export class SmartCellPlugin<RecordType extends BaseRecord = BaseRecord>
  implements BasePlugin<Required<SmartCellConfig>, SmartCellState>
{
  name: string = PluginNames.SMART_CELL;
  config: Required<SmartCellConfig>;

  constructor(config: Partial<SmartCellConfig> = {}) {
    this.config = {
      ...DEFAULT_SMART_CELL_CONFIG,
      ...config,
    } as Required<SmartCellConfig>;
  }

  install() {
    // 插件安装逻辑
    return Promise.resolve();
  }

  uninstall() {
    // 插件卸载逻辑
    return Promise.resolve();
  }

  activate() {
    // 插件激活逻辑
    return Promise.resolve();
  }

  deactivate() {
    // 插件停用逻辑
    return Promise.resolve();
  }

  getHooks() {
    return {
      useSmartCell: (options: Parameters<typeof useSmartCell<RecordType>>[0]) =>
        useSmartCell<RecordType>(options),
    };
  }

  getComponents() {
    return {
      SmartEmptyCell: SmartEmptyCell<RecordType>,
    };
  }

  getMethods() {
    return {
      // 插件方法会通过 hooks 提供
    };
  }

  render() {
    return {
      // 智能单元格主要通过 column render 函数实现
      // 这里可以提供统计信息或其他辅助组件
      footer: (context: PluginContext) => {
        const { state } = context;

        if (!this.config.enabled || !(state as any).smartCell) {
          return null;
        }

        // TODO: 可以添加空值统计信息
        return null;
      },
    };
  }

  // 转换列配置以支持智能单元格
  transformColumns<
    ColumnType extends { dataIndex?: string; [key: string]: unknown },
  >(columns: ColumnType[]): ColumnType[] {
    if (!this.config.enabled) {
      return columns;
    }

    return columns.map((column) => {
      const { dataIndex } = column;
      if (!dataIndex || typeof dataIndex !== 'string') {
        return column;
      }

      const fieldConfig = this.config.fieldConfigs?.[dataIndex];

      if (!fieldConfig) {
        return column;
      }

      // 原始渲染函数
      const originalRender = column.render;

      return {
        ...column,
        render: (value: unknown, record: RecordType, index: number) => {
          // 在实际使用时，这些方法会从 context 中获取
          const { userRole } = this.config;
          const context = {
            fieldName: dataIndex,
            dataSize: 'medium' as const,
            hasRelatedData: false,
            isRequired: false,
            emptyRate: 0,
            rowIndex: index,
          };

          // 如果不是空值，使用原始渲染
          if (!this.isEmpty(value)) {
            return originalRender
              ? (originalRender as any)(value, record, index)
              : value;
          }

          // 渲染智能空值单元格
          const handleEmptyValueClick = this.config.onEmptyValueClick
            ? (params: CellRenderParams<RecordType>) => {
                this.config.onEmptyValueClick?.(params as any);
              }
            : undefined;

          return (
            <SmartEmptyCell<RecordType>
              value={value}
              record={record}
              field={dataIndex}
              emptyConfig={fieldConfig}
              userRole={userRole as any}
              context={context}
              showPermissionHints={this.config.showPermissionHints}
              enableContextualDisplay={this.config.enableContextualDisplay}
              onEmptyValueClick={handleEmptyValueClick}
            >
              {originalRender
                ? (originalRender as any)(value, record, index)
                : value}
            </SmartEmptyCell>
          );
        },
      };
    });
  }

  // 判断是否为空值
  private isEmpty(value: unknown): boolean {
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
  }

  getDefaultState(): SmartCellState {
    return {
      emptyFields: new Set(),
      fieldStats: new Map(),
      totalRows: 0,
      userRole: this.config.userRole,
      currentUserRole: this.config.userRole,
      fieldPermissions: new Map(),
      emptyValueStats: {
        totalEmptyCount: 0,
        fieldEmptyCounts: {},
        interactiveEmptyCount: 0,
      },
    };
  }

  validate() {
    const errors: string[] = [];

    if (
      this.config.enabled &&
      (!this.config.fieldConfigs ||
        Object.keys(this.config.fieldConfigs).length === 0)
    ) {
      errors.push('启用智能单元格时建议配置字段规则');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
