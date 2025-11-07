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

import { logger } from '@veaiops/utils';
import React, { type FC, useMemo, useEffect, useRef } from 'react';

// 导入类型定义
import type { FiltersComponentProps } from './core/types';

// 导入自定义钩子
import {
  useFieldRenderer,
  useFilterConfig,
  useFilterForm,
  useFilterReset,
  useFilterStyle,
  usePluginContext,
  usePluginSystem,
} from './core/hooks';

// 导入子组件
import {
  ActionsArea,
  FieldsArea,
  FilterContainer,
  RightActionsArea,
} from './components';

// 导入日志工具
import { filterLogger } from './utils/logger';
// import { useAutoLogExport } from '@veaiops/utils';

// 导出工具函数和常量
export * from './core/constants';
export * from './core/utils';
export * from './core/renderer';

// 导出 label 转换相关的类型和函数
export type { LabelAsType } from './core/utils';
export { processLabelAsComponentProp } from './core/utils';

// 选择性导出插件系统，避免类型冲突
export {
  filterPluginRegistry,
  initializeCorePlugins,
  getPluginStats,
  pluginExtensionManager,
  corePlugins,
} from './plugins';

// 导出核心类型，避免与插件类型重复
export type {
  FiltersComponentProps,
  FilterStyle,
  FieldItem,
} from './core/types';

// 导出插件系统的类型
export type {
  FilterPlugin,
  FilterPluginContext,
  FilterPluginRenderProps,
  PluginConfig,
  FilterEventBus,
} from '@veaiops/types';

/**
 * 筛选器主组件内部实现
 * 使用插件化架构和组件化结构，支持多种筛选组件类型
 */
const FiltersInner: FC<FiltersComponentProps> = (props) => {
  // 🚀 新增：自动日志导出（仅在开发环境）
  // Note: useAutoLogExport not available in current build context
  const exportLogs = () => Promise.resolve();
  const getLogCount = () => 0;

  const {
    className = '',
    wrapperClassName = '',
    config = [],
    actions = [],
    customActions = [],
    customActionsStyle = {},
    filterStyle,
    query,
    resetFilterValues,
    showReset,
  } = props;

  // 🔧 使用 useMemo 稳定 config 引用，避免因对象重建导致的重渲染
  const stableConfig = useMemo(() => config, [config]);

  // 初始化插件系统
  const { pluginSystemStats } = usePluginSystem();

  // 🔧 修复死循环：使用 useRef 追踪渲染次数，避免每次渲染都记录日志
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const mountTimestamp = useRef(Date.now());
  const componentId = useRef(
    `Filters-${mountTimestamp.current}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
  );

  // 🚨 渲染监控
  const now_render = Date.now();
  if (now_render - lastRenderTimeRef.current > 10000) {
    renderCountRef.current = 0;
    lastRenderTimeRef.current = now_render;
  }

  renderCountRef.current++;

  if (renderCountRef.current > 15) {
    logger.error({
      message: '[Filters] 🚨 渲染超限！可能存在死循环',
      data: {
        renderCount: renderCountRef.current,
        configLength: config?.length,
        queryKeys: Object.keys(query || {}),
      },
      source: 'Filters',
      component: 'RenderMonitor',
    });
  }

  if (renderCountRef.current === 10) {
    logger.warn({
      message: '[Filters] ⚠️ 渲染频繁警告',
      data: {
        renderCount: renderCountRef.current,
      },
      source: 'Filters',
      component: 'RenderMonitor',
    });
  }

  // 🚀 新增：组件挂载日志
  useEffect(() => {
    filterLogger.info({
      component: 'Filters',
      message: '🎬 组件挂载',
      data: {
        componentId: componentId.current,
        mountTime: new Date(mountTimestamp.current).toISOString(),
        initialConfigLength: config.length,
        initialQuery: query,
        configFields: config.map((c: any) => ({
          field: c.field,
          type: c.type,
          label: c.label || c.componentProps?.addBefore || c.addBefore,
          placeholder: c.componentProps?.placeholder || c.placeholder,
        })),
      },
    });

    return () => {
      filterLogger.info({
        component: 'Filters',
        message: '🔚 组件卸载',
        data: {
          componentId: componentId.current,
          lifetime: Date.now() - mountTimestamp.current,
          finalConfigLength: config.length,
        },
      });
    };
  }, []);

  useEffect(() => {
    renderCountRef.current++;
    // 只记录前几次渲染，避免日志爆炸
    if (renderCountRef.current <= 5 || renderCountRef.current % 10 === 0) {
      filterLogger.info({
        component: 'Filters',
        message: '🔄 组件渲染',
        data: {
          componentId: componentId.current,
          configLength: config.length,
          hasQuery: Object.keys(query).length > 0,
          renderCount: renderCountRef.current,
          configFields: config.map((c: any) => ({
            field: c.field,
            type: c.type,
            label: c.label || c.componentProps?.addBefore || c.addBefore,
            placeholder: c.componentProps?.placeholder || c.placeholder,
          })),
          query,
        },
      });
    }
  }, [config, query]);

  // 🚀 新增：监听config变化
  useEffect(() => {
    filterLogger.info({
      component: 'Filters',
      message: '📋 Config变化',
      data: {
        componentId: componentId.current,
        oldLength: renderCountRef.current > 1 ? '查看上一条日志' : 0,
        newLength: config.length,
        newFields: config.map((c: any) => ({
          field: c.field,
          type: c.type,
          label: c.label || c.componentProps?.addBefore || c.addBefore,
          placeholder: c.componentProps?.placeholder || c.placeholder,
          optionsLength: c.componentProps?.options?.length || 0,
          hasOptions: Boolean(c.componentProps?.options),
        })),
        timestamp: new Date().toISOString(),
      },
    });
  }, [config]);

  // 🚀 新增：监听query变化
  useEffect(() => {
    filterLogger.info({
      component: 'Filters',
      message: '🔍 Query变化',
      data: {
        componentId: componentId.current,
        query,
        queryKeys: Object.keys(query),
        timestamp: new Date().toISOString(),
      },
    });
  }, [query]);

  // 记录插件系统初始化（仅一次）
  const pluginInitializedRef = useRef(false);
  useEffect(() => {
    if (!pluginInitializedRef.current) {
      filterLogger.info({
        component: 'Filters',
        message: '插件系统已初始化',
        data: pluginSystemStats,
      });
      pluginInitializedRef.current = true;
    }
  }, [pluginSystemStats]);

  // 管理表单状态
  const { form } = useFilterForm(query);

  // 获取最终样式配置
  const finalStyle = useFilterStyle(filterStyle);

  // 创建插件上下文
  const pluginContext = usePluginContext(form, filterStyle);

  // 获取字段渲染器
  const renderFieldItem = useFieldRenderer(pluginContext);

  // 处理筛选器配置 - 使用稳定的 config
  const { hasFields, hasVisibleFields } = useFilterConfig(stableConfig);

  // 处理重置功能 - 使用稳定的 config
  const { handleReset, canReset } = useFilterReset(
    resetFilterValues,
    stableConfig,
  );

  // 使用useMemo缓存操作区域，避免每次渲染都创建新对象 - 必须在条件return之前
  const actionsArea = useMemo(
    () => (
      <ActionsArea
        wrapperClassName={wrapperClassName}
        showReset={showReset}
        canReset={canReset}
        onReset={handleReset}
        customActions={customActions}
        customActionsStyle={customActionsStyle}
      />
    ),
    [
      wrapperClassName,
      showReset,
      canReset,
      handleReset,
      customActions,
      customActionsStyle,
    ],
  );

  // 如果没有字段配置，不渲染组件（与旧代码保持一致）
  if (!hasFields) {
    return null;
  }

  return (
    <FilterContainer className={className} filterStyle={finalStyle}>
      <FieldsArea
        config={stableConfig}
        renderFieldItem={renderFieldItem}
        actionsArea={actionsArea}
      />

      <RightActionsArea actions={actions} />
    </FilterContainer>
  );
};

/**
 * 🔧 使用 React.memo 优化 Filters 组件重渲染
 *
 * 🎯 关键优化：比较config时忽略onChange等函数（每次都是新的）
 */
export const Filters = React.memo(FiltersInner, (prevProps, nextProps) => {
  // 🔧 比较config：只比较结构和数据，忽略函数
  const compareConfig = (
    prev: any[] | undefined,
    next: any[] | undefined,
  ): boolean => {
    if (prev === next) {
      return true;
    }
    if (!prev || !next || prev.length !== next.length) {
      return false;
    }

    for (let i = 0; i < prev.length; i++) {
      // 比较字段定义
      if (prev[i].type !== next[i].type) {
        return false;
      }
      if (prev[i].field !== next[i].field) {
        return false;
      }

      // 比较componentProps，跳过函数
      const prevComp = prev[i].componentProps || {};
      const nextComp = next[i].componentProps || {};

      for (const key of Object.keys(prevComp)) {
        if (typeof prevComp[key] === 'function') {
          continue;
        } // 跳过函数
        if (JSON.stringify(prevComp[key]) !== JSON.stringify(nextComp[key])) {
          return false;
        }
      }
    }
    return true;
  };

  // 比较config
  if (!compareConfig(prevProps.config, nextProps.config)) {
    logger.info({
      message: '[Filters] 🔄 config变化，需要重新渲染',
      data: {
        prevLength: prevProps.config?.length,
        nextLength: nextProps.config?.length,
      },
      source: 'Filters',
      component: 'ReactMemo',
    });
    return false;
  }

  // 比较 query 对象
  if (JSON.stringify(prevProps.query) !== JSON.stringify(nextProps.query)) {
    logger.info({
      message: '[Filters] 🔄 query变化，需要重新渲染',
      data: { prevQuery: prevProps.query, nextQuery: nextProps.query },
      source: 'Filters',
      component: 'ReactMemo',
    });
    return false;
  }

  // 比较其他关键 props
  const keysToCompare: (keyof FiltersComponentProps)[] = [
    'className',
    'wrapperClassName',
    'showReset',
  ];

  for (const key of keysToCompare) {
    if (prevProps[key] !== nextProps[key]) {
      logger.info({
        message: `[Filters] 🔄 ${String(key)}变化，需要重新渲染`,
        data: { prevValue: prevProps[key], nextValue: nextProps[key] },
        source: 'Filters',
        component: 'ReactMemo',
      });
      return false;
    }
  }

  logger.debug({
    message: '[Filters] ⏭️ props未变化，跳过渲染',
    data: {},
    source: 'Filters',
    component: 'ReactMemo',
  });
  return true; // props相同，不重新渲染
});

// 默认导出
export default Filters;
