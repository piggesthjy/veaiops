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
 * Schema表格预设模板
 * @description 提供常用的表格配置模板

 * @date 2025-12-19
 */

import type {
  PresetTemplate,
  TableSchema,
} from '@/custom-table/types/schema-table';

// 基础表格预设
const basicPreset: Partial<TableSchema> = {
  features: {
    pagination: {
      current: 1,
      pageSize: 10,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: true,
      pageSizeOptions: ['10', '20', '50', '100'],
    },
    bordered: true,
    size: 'default',
  },
};

// 高级搜索表格预设
const advancedPreset: Partial<TableSchema> = {
  features: {
    pagination: {
      current: 1,
      pageSize: 20,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: true,
      pageSizeOptions: ['10', '20', '50', '100'],
    },
    search: {
      layout: 'horizontal',
      collapsed: true,
      resetText: '重置',
      searchText: '查询',
    },
    toolbar: {
      settings: {
        density: true,
        columnSetting: true,
        fullScreen: true,
        reload: true,
      },
    },
    bordered: true,
    size: 'default',
  },
};

// 可编辑表格预设
const editablePreset: Partial<TableSchema> = {
  features: {
    pagination: {
      current: 1,
      pageSize: 10,
      showSizeChanger: true,
      showTotal: true,
    },
    rowSelection: {
      type: 'checkbox',
      fixed: true,
    },
    editable: true,
    bordered: true,
    size: 'default',
  },
};

// 只读表格预设
const readonlyPreset: Partial<TableSchema> = {
  features: {
    pagination: {
      current: 1,
      pageSize: 20,
      showSizeChanger: false,
      showQuickJumper: false,
      showTotal: true,
      simple: true,
    },
    bordered: false,
    size: 'small',
  },
};

// 移动端表格预设
const mobilePreset: Partial<TableSchema> = {
  features: {
    pagination: {
      current: 1,
      pageSize: 10,
      showSizeChanger: false,
      showQuickJumper: false,
      showTotal: false,
      simple: true,
      size: 'small',
    },
    bordered: false,
    size: 'small',
  },
};

// 仪表板表格预设
const dashboardPreset: Partial<TableSchema> = {
  features: {
    pagination: {
      current: 1,
      pageSize: 5,
      showSizeChanger: false,
      showQuickJumper: false,
      showTotal: false,
      simple: true,
      size: 'small',
    },
    toolbar: {
      settings: {
        reload: true,
      },
    },
    bordered: false,
    size: 'small',
  },
};

// 默认预设模板
export const DEFAULT_PRESETS: Record<string, PresetTemplate> = {
  basic: {
    name: '基础表格',
    description: '包含基本的分页、排序功能的标准表格',
    schema: basicPreset,
  },
  advanced: {
    name: '高级表格',
    description: '包含搜索、工具栏、列设置等高级功能的表格',
    schema: advancedPreset,
  },
  editable: {
    name: '可编辑表格',
    description: '支持行内编辑、行选择的交互式表格',
    schema: editablePreset,
  },
  readonly: {
    name: '只读表格',
    description: '简洁的只读展示表格，适用于数据展示场景',
    schema: readonlyPreset,
  },
  mobile: {
    name: '移动端表格',
    description: '适配移动端的紧凑型表格',
    schema: mobilePreset,
  },
  dashboard: {
    name: '仪表板表格',
    description: '适用于仪表板的小型数据展示表格',
    schema: dashboardPreset,
  },
};

// 获取预设配置
export const getPreset = (presetName: string): Partial<TableSchema> => {
  const preset = DEFAULT_PRESETS[presetName];
  if (!preset) {
    return DEFAULT_PRESETS.basic.schema;
  }
  return preset.schema;
};

// 合并预设配置
export const mergePreset = (
  baseSchema: Partial<TableSchema>,
  presetName: string,
): TableSchema => {
  const presetSchema = getPreset(presetName);

  return {
    ...presetSchema,
    ...baseSchema,
    features: {
      ...presetSchema.features,
      ...baseSchema.features,
    },
    style: {
      ...presetSchema.style,
      ...baseSchema.style,
    },
  } as TableSchema;
};

// 列出所有可用预设
export const listPresets = (): Array<{
  key: string;
  name: string;
  description: string;
}> => {
  return Object.entries(DEFAULT_PRESETS).map(([key, preset]) => ({
    key,
    name: preset.name,
    description: preset.description,
  }));
};
