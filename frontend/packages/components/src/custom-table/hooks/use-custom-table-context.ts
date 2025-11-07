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
 * CustomTable 上下文增强 Hook
 * 负责处理插件属性增强和上下文管理
 *

 * @date 2025-12-19
 */
import type {
  BaseQuery,
  BaseRecord,
  Plugin,
  PluginContext,
  PluginManager,
} from '@/custom-table/types';
import { useMemo } from 'react';

/**
 * 应用插件属性增强的辅助函数
 * @param enabledPlugins 启用的插件列表
 * @param baseContext 基础上下文
 * @returns 增强后的属性
 */
const applyPluginEnhancements = <
  RecordType extends BaseRecord,
  QueryType extends BaseQuery,
>(
  enabledPlugins: Plugin[],
  baseContext: PluginContext<RecordType, QueryType>,
) => {
  let enhancedProps = { ...baseContext.props };

  for (const plugin of enabledPlugins) {
    if (plugin.enhanceProps && typeof plugin.enhanceProps === 'function') {
      try {
        const enhanced = plugin.enhanceProps(enhancedProps, baseContext as any);
        if (enhanced && typeof enhanced === 'object') {
          enhancedProps = { ...enhancedProps, ...enhanced };
        }
      } catch (error) {
        // 插件属性增强失败，跳过该插件（静默处理，不影响其他插件）
      }
    }
  }

  return enhancedProps;
};

/**
 * @name 创建增强的表格上下文
 * @description 基于插件系统应用属性增强，返回最终的上下文对象
 */
export const useEnhancedTableContext = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  baseContext: PluginContext<RecordType, QueryType>,
  pluginManager: PluginManager,
): PluginContext<RecordType, QueryType> => {
  // 第三阶段：应用插件属性增强（如果有的话）
  const enhancedContext = useMemo(() => {
    // 检查是否有插件需要增强属性
    type PluginWithEnabled = Plugin & { enabled?: boolean };
    const enabledPlugins = pluginManager
      .getAllPlugins()
      .filter((p: Plugin): p is PluginWithEnabled => {
        const pluginWithEnabled = p as PluginWithEnabled;
        return Boolean(pluginWithEnabled.enabled);
      });
    const hasPropsEnhancer = enabledPlugins.some(
      (plugin: Plugin) =>
        plugin.enhanceProps && typeof plugin.enhanceProps === 'function',
    );

    if (!hasPropsEnhancer) {
      return baseContext; // 没有增强器，直接返回基础上下文
    }

    // 安全地应用属性增强
    try {
      // 安全地应用属性增强
      const enhancedProps = applyPluginEnhancements(
        enabledPlugins,
        baseContext,
      );

      // 返回带有增强属性的新上下文
      return {
        ...baseContext,
        props: enhancedProps,
      };
    } catch (error) {
      // 上下文增强失败，回退到基础上下文（静默处理）
      return baseContext;
    }
  }, [baseContext, pluginManager]);

  return enhancedContext;
};

export { useEnhancedTableContext as useCustomTableContext };
