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

import type { FilterPluginRenderProps } from '@veaiops/types';
import React, { useState } from 'react';
import { type FieldItem, Filters } from './index';
import { filterPluginRegistry, pluginExtensionManager } from './plugins';

/**
 * 插件化筛选器使用示例
 */
export const FilterExample: React.FC = () => {
  const [query, setQuery] = useState<Record<string, unknown>>({});

  // 示例配置 - 使用插件化系统
  const filterConfig: FieldItem[] = [
    {
      field: 'name',
      label: '姓名',
      type: 'Input',
      componentProps: {
        placeholder: '请输入姓名',
        allowClear: true,
      },
    },
    {
      field: 'age',
      label: '年龄',
      type: 'InputNumber',
      componentProps: {
        placeholder: '请输入年龄',
        min: 0,
        max: 120,
      },
    },
    {
      field: 'status',
      label: '状态',
      type: 'Select',
      componentProps: {
        options: [
          { label: '启用', value: 'active' },
          { label: '禁用', value: 'inactive' },
          { label: '待审核', value: 'pending' },
        ],
      },
    },
    {
      field: 'category',
      label: '分类',
      type: 'Cascader',
      componentProps: {
        options: [
          {
            value: 'tech',
            label: '技术',
            children: [
              { value: 'frontend', label: '前端' },
              { value: 'backend', label: '后端' },
            ],
          },
          {
            value: 'design',
            label: '设计',
            children: [
              { value: 'ui', label: 'UI设计' },
              { value: 'ux', label: 'UX设计' },
            ],
          },
        ],
      },
    },
    {
      field: 'dateRange',
      label: '日期范围',
      type: 'RangePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
      },
    },
    {
      field: 'tags',
      label: '标签',
      type: 'InputTag',
      componentProps: {
        placeholder: '请输入标签',
      },
    },
    {
      field: 'isActive',
      label: '是否激活',
      type: 'Checkbox',
      componentProps: {
        label: '激活状态',
      },
    },
    {
      field: 'customerIDs',
      label: '账户',
      type: 'Select.Account',
      componentProps: {
        mode: 'multiple',
        maxTagCount: 1,
        placeholder: '请选择账户',
        allowClear: true,
      },
    },
    {
      field: 'employeeIDs',
      label: '员工',
      type: 'Select.Employee',
      componentProps: {
        mode: 'multiple',
        maxTagCount: 2,
        placeholder: '请选择员工',
        allowClear: true,
      },
    },
  ];

  // 自定义配置示例
  React.useEffect(() => {
    // 为 Input 组件添加全局配置
    pluginExtensionManager.setGlobalConfig({
      pluginType: 'Input',
      config: {
        size: 'default',
        autoComplete: 'off',
      },
    });

    // 为 Select 组件添加自定义钩子
    pluginExtensionManager.registerHooks({
      pluginType: 'Select',
      hooks: {
        beforeRender: (props: FilterPluginRenderProps) => {
          return {
            ...props,
            hijackedProps: {
              ...props.hijackedProps,
              showSearch: true,
              filterOption: true,
            },
          };
        },
      },
    });
  }, []);

  const handleReset = () => {
    setQuery({});
  };

  const handleQueryChange = (newQuery: Record<string, unknown>) => {
    setQuery(newQuery);
  };

  // 获取插件系统统计信息
  const pluginStats = filterPluginRegistry.getStats();
  const extensionStats = pluginExtensionManager.getStats();

  return (
    <div style={{ padding: '20px' }}>
      <h2>插件化筛选器示例</h2>

      {/* 插件系统信息 */}
      <div
        style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <h4>插件系统状态</h4>
        <p>已注册插件: {pluginStats.total} 个</p>
        <p>插件类型: {pluginStats.types.join(', ')}</p>
        <p>扩展钩子: {extensionStats.hooksCount} 个</p>
        <p>全局配置: {extensionStats.configsCount} 个</p>
      </div>

      {/* 筛选器组件 */}
      <Filters
        config={filterConfig}
        query={query}
        showReset={true}
        resetFilterValues={handleReset}
        filterStyle={{
          isWithBackgroundAndBorder: true,
          style: { padding: '16px' },
        }}
      />

      {/* 当前查询状态 */}
      <div style={{ marginTop: '20px' }}>
        <h4>当前查询状态:</h4>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
          }}
        >
          {JSON.stringify(query, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default FilterExample;
