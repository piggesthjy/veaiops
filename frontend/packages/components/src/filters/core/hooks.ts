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

import { Form } from '@arco-design/web-react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  type FilterPluginContext,
  filterPluginRegistry,
  initializeCorePlugins,
} from '../plugins';
import { defaultFilterStyle } from './constants';
import { renderSingleField } from './renderer';
import type { FieldItem, FilterStyle } from './types';
import { createPluginContext, isFieldVisible, mergeFilterStyle } from './utils';

/**
 * 使用插件系统初始化钩子
 * @returns 插件系统状态
 */
export const usePluginSystem = () => {
  // 初始化插件系统（仅在首次渲染时）
  const pluginSystemStats = useMemo(() => {
    return initializeCorePlugins();
  }, []);

  return {
    pluginSystemStats,
    registry: filterPluginRegistry,
  };
};

/**
 * 使用筛选器表单钩子
 * @param query 查询对象
 * @returns 表单实例和相关方法
 */
export const useFilterForm = (query: Record<string, unknown>) => {
  const [form] = Form.useForm();

  // 当查询对象变化时更新表单值
  useEffect(() => {
    form.setFieldsValue(query);
  }, [form, query]);

  return {
    form,
    setFieldsValue: form.setFieldsValue,
    getFieldsValue: form.getFieldsValue,
    resetFields: form.resetFields,
  };
};

/**
 * 使用插件上下文钩子
 * @param form 表单实例
 * @param filterStyle 筛选器样式
 * @returns 插件上下文
 */
export const usePluginContext = (
  form: unknown,
  filterStyle?: Partial<FilterStyle>,
): FilterPluginContext => {
  return useMemo(() => {
    const finalStyle = mergeFilterStyle(defaultFilterStyle, filterStyle);
    return createPluginContext(
      form,
      finalStyle,
      filterPluginRegistry.getEventBus(),
    );
  }, [form, filterStyle]);
};

/**
 * 使用字段渲染钩子
 * @param context 插件上下文
 * @returns 字段渲染函数
 */
export const useFieldRenderer = (context: FilterPluginContext) => {
  return useCallback(
    (field: FieldItem) => {
      if (!isFieldVisible(field)) {
        return null;
      }

      return renderSingleField(field, context, field.field);
    },
    [context],
  );
};

/**
 * 使用筛选器样式钩子
 * @param filterStyle 自定义样式
 * @returns 最终样式配置
 */
export const useFilterStyle = (filterStyle?: Partial<FilterStyle>) => {
  return useMemo(() => {
    return mergeFilterStyle(defaultFilterStyle, filterStyle);
  }, [filterStyle]);
};

/**
 * 使用筛选器配置钩子
 * @param config 字段配置数组
 * @returns 处理后的配置和统计信息
 */
export const useFilterConfig = (config: FieldItem[] = []) => {
  const configStats = useMemo(() => {
    const visibleFields = config.filter(isFieldVisible);
    const hiddenFields = config.filter((field) => !isFieldVisible(field));

    const typeCount = config.reduce(
      (acc, field) => {
        if (field.type) {
          acc[field.type] = (acc[field.type] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: config.length,
      visible: visibleFields.length,
      hidden: hiddenFields.length,
      typeCount,
      types: Object.keys(typeCount),
    };
  }, [config]);

  return {
    config,
    configStats,
    hasFields: config.length > 0,
    hasVisibleFields: configStats.visible > 0,
  };
};

/**
 * 使用重置筛选器钩子
 * @param resetFilterValues 重置回调函数
 * @param config 字段配置
 * @returns 重置相关方法
 */
export const useFilterReset = (
  resetFilterValues?: (props: { resetEmptyData?: boolean }) => void,
  config: FieldItem[] = [],
) => {
  const handleReset = useCallback(() => {
    if (resetFilterValues) {
      resetFilterValues({});
    }
  }, [resetFilterValues]);

  const canReset = useMemo(() => {
    return Boolean(resetFilterValues && config.length > 0);
  }, [resetFilterValues, config.length]);

  return {
    handleReset,
    canReset,
  };
};
