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

import { PluginNames } from '@/custom-table/types/constants/enum';
/**
 * 行内编辑插件
 * 基于 EPS 平台的可编辑表格能力
 */
import type { BaseRecord } from '@/custom-table/types/core/common';
import { EditableCell } from './components';
import { DEFAULT_INLINE_EDIT_CONFIG } from './config';
import { useInlineEdit } from './hooks';
import type { EditState, InlineEditConfig } from './types';

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
 * 行内编辑插件类
 */
export class InlineEditPlugin<RecordType extends BaseRecord = BaseRecord>
  implements
    BasePlugin<Required<InlineEditConfig<RecordType>>, EditState<RecordType>>
{
  name: string = PluginNames.INLINE_EDIT;
  config: Required<InlineEditConfig<RecordType>>;

  constructor(config: Partial<InlineEditConfig<RecordType>> = {}) {
    this.config = { ...DEFAULT_INLINE_EDIT_CONFIG, ...config } as Required<
      InlineEditConfig<RecordType>
    >;
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
      useInlineEdit: (
        options: Parameters<typeof useInlineEdit<RecordType>>[0],
      ) => useInlineEdit<RecordType>(options),
    };
  }

  getComponents() {
    return {
      EditableCell: EditableCell<RecordType>,
    };
  }

  getMethods() {
    return {
      // 插件方法会通过 hooks 提供
    };
  }

  render() {
    return {
      // 行内编辑主要通过 column render 函数实现
      // 这里可以提供工具栏或其他辅助组件
      toolbar: (context: any) => {
        const { state, methods } = context;

        if (!this.config.enabled || !this.config.allowBatchEdit) {
          return null;
        }

        // TODO: 可以添加批量编辑工具栏
        return null;
      },
    };
  }

  // 转换列配置以支持编辑
  transformColumns<
    ColumnType extends {
      dataIndex?: string;
      render?: (...args: unknown[]) => React.ReactNode;
      [key: string]: unknown;
    },
  >(columns: ColumnType[]): ColumnType[] {
    if (!this.config.enabled) {
      return columns;
    }

    return columns.map((column) => {
      const fieldConfig = this.config.fields?.find(
        (f) => f.dataIndex === column.dataIndex,
      );

      if (!fieldConfig) {
        return column;
      }

      // 原始渲染函数
      const originalRender = column.render;

      return {
        ...column,
        render: (value: unknown, record: RecordType, index: number) => {
          // 在实际使用时，这些方法会从 context 中获取
          const isEditing = false; // methods.isEditing(getRowKey(record), column.dataIndex);
          const onStartEdit = () => {
            // TODO: methods.startEdit(getRowKey(record), column.dataIndex);
          };
          const onFinishEdit = async (_editValue: unknown) => {
            // TODO: methods.finishEdit(editValue);
          };
          const onCancelEdit = () => {
            // TODO: methods.cancelEdit();
          };

          // 渲染可编辑单元格
          return (
            <EditableCell<RecordType>
              value={value}
              record={record}
              fieldConfig={fieldConfig}
              mode={this.config.mode}
              trigger={this.config.trigger}
              editing={isEditing}
              onStartEdit={onStartEdit}
              onFinishEdit={onFinishEdit}
              onCancelEdit={onCancelEdit}
            >
              {originalRender
                ? (originalRender(value, record, index) as any)
                : value}
            </EditableCell>
          );
        },
      };
    });
  }

  getDefaultState(): EditState<RecordType> {
    return {
      editingCells: new Map(),
      editingRows: new Set(),
      originalValues: new Map(),
      validationErrors: new Map(),
      hasChanges: false,
      isAnyEditing: false,
      editingValues: new Map(),
      editingErrors: new Map(),
      hasUnsavedChanges: false,
      validationState: new Map(),
    };
  }

  validate() {
    const errors: string[] = [];

    if (
      this.config.enabled &&
      (!this.config.fields || this.config.fields.length === 0)
    ) {
      errors.push('启用行内编辑时必须配置编辑字段');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
