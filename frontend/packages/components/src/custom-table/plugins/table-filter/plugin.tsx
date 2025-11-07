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

import { PluginNames } from '@/custom-table/constants/enum';
import { PluginPriorityEnum } from '@/custom-table/types/core/enums';
import type {
  PluginContext,
  PluginFactory,
} from '@/custom-table/types/plugins';
import type { TableFilterConfig } from '@/custom-table/types/plugins/table-filter';
import { Filters } from '@/filters';
import type { FieldItem } from '@/filters';
/**
 * 表格过滤器插件
 */
// 使用新的 Filters 组件（插件化筛选器）
import { logger } from '@veaiops/utils';
import { DEFAULT_TABLE_FILTER_CONFIG } from './config';
import { readFiltersPluginProps } from './props';

// 🔍 TableFilter日志收集器
interface TableFilterLogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  data?: any;
}

interface TableFilterLogParams {
  level: TableFilterLogEntry['level'];
  component: string;
  message: string;
  data?: any;
}

class TableFilterLogger {
  private logs: TableFilterLogEntry[] = [];
  private enabled = true;

  log({ level, component, message, data }: TableFilterLogParams): void {
    if (!this.enabled) {
      return;
    }

    const entry: TableFilterLogEntry = {
      timestamp: Date.now(),
      level,
      component,
      message,
      data,
    };

    this.logs.push(entry);

    // ✅ 统一使用 @veaiops/utils logger（logger 内部已处理 console 输出）
    const logData = data ? { data } : undefined;
    switch (level) {
      case 'error':
        logger.error({
          message,
          data: logData,
          source: 'CustomTable',
          component: `TableFilterPlugin/${component}`,
        });
        break;
      case 'warn':
        logger.warn({
          message,
          data: logData,
          source: 'CustomTable',
          component: `TableFilterPlugin/${component}`,
        });
        break;
      case 'debug':
        logger.debug({
          message,
          data: logData,
          source: 'CustomTable',
          component: `TableFilterPlugin/${component}`,
        });
        break;
      default:
        logger.info({
          message,
          data: logData,
          source: 'CustomTable',
          component: `TableFilterPlugin/${component}`,
        });
        break;
    }
  }

  info({
    component,
    message,
    data,
  }: { component: string; message: string; data?: any }): void {
    this.log({ level: 'info', component, message, data });
  }

  warn({
    component,
    message,
    data,
  }: { component: string; message: string; data?: any }): void {
    this.log({ level: 'warn', component, message, data });
  }

  error({
    component,
    message,
    data,
  }: { component: string; message: string; data?: any }): void {
    this.log({ level: 'error', component, message, data });
  }

  debug({
    component,
    message,
    data,
  }: { component: string; message: string; data?: any }): void {
    this.log({ level: 'debug', component, message, data });
  }

  getLogs(): TableFilterLogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

const tableFilterLogger = new TableFilterLogger();

// 暴露到全局供日志导出系统使用
if (typeof window !== 'undefined') {
  (window as any).getTableFilterLogs = () => tableFilterLogger.getLogs();
}

export const TableFilterPlugin: PluginFactory<TableFilterConfig> = (
  config: TableFilterConfig = {},
) => {
  const finalConfig = { ...DEFAULT_TABLE_FILTER_CONFIG, ...config };

  // 🔧 缓存handleChangeAdapter和configs，避免每次render都重新创建
  let cachedHandleChange: any = null;
  let cachedHandleChangeAdapter: any = null;
  let cachedConfigs: any = null;
  let cachedQuery: any = null;
  let cachedHandleFilters: any = null; // 🔥 新增：缓存handleFilters函数引用

  // 🚀 新增：插件实例ID，用于追踪同一插件实例的生命周期
  const pluginInstanceId = `TableFilterPlugin-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  return {
    name: PluginNames.TABLE_FILTER,
    version: '1.0.0',
    description: '表格过滤器插件',
    priority: finalConfig.priority || PluginPriorityEnum.MEDIUM,
    enabled: finalConfig.enabled !== false,
    dependencies: [],
    conflicts: [],

    install(_context: PluginContext) {
      // 🔧 关键修复：安装时清理缓存，避免路由切换时使用旧页面的缓存
      const hadCache = cachedConfigs !== null;
      const oldCacheSnapshot = hadCache
        ? cachedConfigs?.map((c: any) => ({
            type: c.type,
            label: c.componentProps?.addBefore,
          }))
        : null;

      // 清理缓存
      cachedHandleChange = null;
      cachedHandleChangeAdapter = null;
      cachedConfigs = null;
      cachedQuery = null;

      tableFilterLogger.info({
        component: 'Plugin',
        message: '🎬 插件安装',
        data: {
          pluginInstanceId,
          hadOldCache: hadCache,
          oldCacheSnapshot,
          cacheCleared: true,
          timestamp: new Date().toISOString(),
        },
      });
    },

    setup(context: PluginContext) {
      // 初始化过滤器逻辑
      const {
        props: {
          // 🎯 从 props 中获取 showReset，优先使用 props 值
          showReset: propsShowReset,
        },
      } = context;

      // 🎯 优先使用 props 中的 showReset，如果没有则使用配置默认值
      const effectiveShowReset =
        propsShowReset !== undefined ? propsShowReset : finalConfig.showReset;

      // 插件设置逻辑 - 不调用 Hook，只进行配置
      // Hook 调用已移到组件层面
      // 直接使用 props 中的值设置状态
      Object.assign(context.state, {
        filterConfigs: finalConfig.filterConfigs || [],
        isFilterShow: finalConfig.isFilterShow,
        isFilterAffixed: finalConfig.isFilterAffixed,
        isFilterCollection: finalConfig.isFilterCollection,
        filterStyleCfg: finalConfig.filterStyleCfg || {},
        showReset: effectiveShowReset,
      });

      Object.assign(context.helpers, {
        resetFilterValues: () => {
          // 基于 Arco Table 的过滤器重置实现
          // 重置所有过滤器值到初始状态
          Object.assign(context.state, {
            filters: {},
            filterValues: {},
            activeFilters: {},
          });
          // 触发数据重新加载
          if (context.helpers.reload) {
            context.helpers.reload();
          }
        },
      });
    },

    update(_context: PluginContext) {
      // 当配置或数据更新时的操作
    },

    uninstall(_context: PluginContext) {
      // 卸载时的清理操作
      tableFilterLogger.info({
        component: 'Plugin',
        message: '🔚 插件卸载',
        data: {
          pluginInstanceId,
          hadCachedConfigs: cachedConfigs !== null,
          cachedConfigsLength: cachedConfigs?.length || 0,
          cachedConfigsSnapshot: cachedConfigs?.map((c: any) => ({
            type: c.type,
            label: c.componentProps?.addBefore,
          })),
          timestamp: new Date().toISOString(),
        },
      });

      // 🚀 清理缓存 - 这是关键！必须清空才能让新页面重新生成configs
      cachedHandleChange = null;
      cachedHandleChangeAdapter = null;
      cachedConfigs = null;
      cachedQuery = null;

      tableFilterLogger.info({
        component: 'Plugin',
        message: '✅ 缓存已清理',
        data: {
          pluginInstanceId,
          timestamp: new Date().toISOString(),
        },
      });
    },

    // 过滤器钩子
    hooks: {
      resetFilters: (...args: unknown[]) => {
        const context = args[0] as PluginContext;
        return context.helpers.resetFilterValues?.();
      },
    },

    // 渲染方法
    render: {
      // 渲染过滤器
      filter(context: PluginContext) {
        tableFilterLogger.info({
          component: 'Plugin',
          message: '🎨 render.filter被调用',
          data: {
            pluginInstanceId,
            timestamp: new Date().toISOString(),
          },
        });

        const {
          state: { query },
          helpers: { reset, handleChange },
        } = context;

        tableFilterLogger.info({
          component: 'Plugin',
          message: '📊 Context状态',
          data: {
            pluginInstanceId,
            query,
            queryKeys: Object.keys(query || {}),
            hasReset: typeof reset === 'function',
            hasHandleChange: typeof handleChange === 'function',
          },
        });

        // 源头修复：使用强类型读取扩展 props，避免宽松断言
        const {
          handleFilters,
          handleFiltersProps = {},
          isFilterShow = true,
          filterStyleCfg,
          showReset: propsShowReset,
          operations = [],
          customActions = [],
          customActionsStyle,
          tableFilterProps = {},
          tableFilterWrapperClassName = '',
          finalQuery,
        } = readFiltersPluginProps(context);

        // 🎯 优先使用 props 中的 showReset，如果没有则默认为 true
        const effectiveShowReset =
          propsShowReset !== undefined ? propsShowReset : true;

        if (
          !isFilterShow ||
          !handleFilters ||
          typeof handleFilters !== 'function'
        ) {
          return null;
        }

        // 动态生成过滤器配置
        // 🔧 关键修复：缓存handleChangeAdapter，避免每次render都创建新函数
        if (cachedHandleChange !== handleChange) {
          cachedHandleChange = handleChange;
          cachedHandleChangeAdapter = (k: unknown, v: unknown) => {
            tableFilterLogger.info({
              component: 'handleChangeAdapter',
              message: '📥 handleChangeAdapter被调用',
              data: {
                key: k,
                value: v,
                timestamp: new Date().toISOString(),
              },
            });
            // context.helpers.handleChange 接受 (keyOrObject, value?, handleFilter?, ctx?)
            cachedHandleChange?.(k as any, v);
          };
        }

        // 🔧 关键修复：检查query或handleFilters函数是否变化
        const queryChanged =
          JSON.stringify(cachedQuery) !== JSON.stringify(query);
        const handleFiltersChanged = cachedHandleFilters !== handleFilters;

        if (queryChanged || handleFiltersChanged || !cachedConfigs) {
          let changeReason = 'first render';
          if (queryChanged) {
            changeReason = 'query changed';
          } else if (handleFiltersChanged) {
            changeReason = 'handleFilters function changed';
          }

          tableFilterLogger.info({
            component: 'Plugin',
            message: '🔄 重新生成configs',
            data: {
              pluginInstanceId,
              reason: changeReason,
              queryChanged,
              handleFiltersChanged,
              oldQuery: cachedQuery,
              newQuery: query,
              oldQueryString: JSON.stringify(cachedQuery),
              newQueryString: JSON.stringify(query),
              timestamp: new Date().toISOString(),
            },
          });

          cachedQuery = query;
          cachedHandleFilters = handleFilters;
          cachedConfigs =
            handleFilters({
              query,
              handleChange: cachedHandleChangeAdapter,
              handleFiltersProps,
            }) || [];

          tableFilterLogger.info({
            component: 'Plugin',
            message: '✨ Configs生成完成',
            data: {
              pluginInstanceId,
              configsLength: cachedConfigs?.length || 0,
              configFields:
                cachedConfigs?.map((c: any) => ({
                  field: c.field,
                  type: c.type,
                  label: c.label || c.componentProps?.addBefore || c.addBefore,
                  placeholder: c.componentProps?.placeholder || c.placeholder,
                  optionsLength: c.componentProps?.options?.length || 0, // 🔥 新增：显示options长度
                  hasOptions: Boolean(c.componentProps?.options),
                })) || [],
            },
          });
        } else {
          tableFilterLogger.debug({
            component: 'Plugin',
            message: '✅ 使用缓存的configs',
            data: {
              pluginInstanceId,
              configsLength: cachedConfigs?.length || 0,
              cachedQueryString: JSON.stringify(cachedQuery),
              currentQueryString: JSON.stringify(query),
              handleFiltersSame: cachedHandleFilters === handleFilters,
            },
          });
        }

        const configs = cachedConfigs;

        // 调试日志：确认过滤器配置
        if (process.env.NODE_ENV === 'development') {
          logger.info({
            message: 'Rendering filter with configs',
            data: {
              configsLength: configs.length,
              query,
              hasHandleChange: typeof handleChange === 'function',
            },
            source: 'CustomTable',
            component: 'TableFilterPlugin',
          });
        }

        if (!configs.length) {
          return null;
        }

        // 旧版 CustomFields 动态节点在此插件中未再使用，移除以避免未使用变量警告

        // 规范化 filterStyle，确保满足 Filters 的 FilterStyle 类型要求
        const filterStyleSafe: {
          isWithBackgroundAndBorder: boolean;
          style?: React.CSSProperties;
        } =
          typeof filterStyleCfg === 'object' && filterStyleCfg !== null
            ? {
                isWithBackgroundAndBorder:
                  (filterStyleCfg as any).isWithBackgroundAndBorder ?? true,
                style: (filterStyleCfg as any).style,
              }
            : { isWithBackgroundAndBorder: true };

        // 将旧 TableFilter 的 props聚合为中间对象
        // 并把 configs 明确断言为 FieldItem[] 以满足 Filters 的类型
        const configsTyped = configs as unknown as FieldItem[];

        const filterProps = {
          config: configsTyped, // FieldItem[] 配置
          query: finalQuery || query,
          // 旧布尔开关保留在插件层，不传给 Filters
          resetFilterValues: (props?: { resetEmptyData?: boolean }) => {
            reset?.(props || { resetEmptyData: false });
          },
          showReset: effectiveShowReset,
          actions: operations || [],
          customActions: customActions || [],
          customActionsStyle,
          className: tableFilterWrapperClassName || '',
          filterStyle: filterStyleSafe,
          ...tableFilterProps,
        };

        // 调试日志：确认传递给 Filters 的属性（迁移）
        if (process.env.NODE_ENV === 'development') {
          logger.info({
            message: 'Mapped Filters props',
            data: {
              configLength: configs.length,
              isFilterShow,
              query,
              hasResetFunction:
                typeof filterProps.resetFilterValues === 'function',
              tableFilterWrapperClassName,
              filterStyleCfg,
            },
            source: 'CustomTable',
            component: 'TableFilterMigration',
          });
        }

        // 将旧 TableFilter 的 props 映射到新 Filters 组件的 Props
        const mappedProps = {
          config: filterProps.config,
          query: filterProps.query,
          showReset: Boolean(filterProps.showReset),
          // 包装 reset，增加前后快照日志，便于定位“默认值被清空”的问题
          resetFilterValues: (props?: { resetEmptyData?: boolean }) => {
            if (process.env.NODE_ENV === 'development') {
              logger.info({
                message: 'TableFilter reset click',
                data: {
                  queryBefore: context.state?.query,
                  resetProps: props,
                },
                source: 'CustomTable',
                component: 'TableFilterPlugin',
              });
            }
            // 始终以不清空的方式触发表格 reset（恢复默认）
            reset?.(props || { resetEmptyData: false });
            // 下一宏任务读取一次 query 快照
            setTimeout(() => {
              if (process.env.NODE_ENV === 'development') {
                logger.info({
                  message: 'TableFilter reset after',
                  data: {
                    queryAfter: context.state?.query,
                  },
                  source: 'CustomTable',
                  component: 'TableFilterPlugin',
                });
              }
            }, 0);
          },
          // 将原始 actions/customActions 转为 ReactNode 类型以匹配 FiltersProps
          actions: (filterProps.actions || []) as React.ReactNode[],
          customActions: (filterProps.customActions || []) as
            | React.ReactNode[]
            | React.ReactNode,
          customActionsStyle: filterProps.customActionsStyle as
            | React.CSSProperties
            | undefined,
          // 新组件支持 wrapperClassName，旧组件使用 className 作为外层包装器类名
          className: '',
          wrapperClassName: filterProps.className || '',
          // 规范化后的 filterStyle，满足 FilterStyle 要求
          filterStyle: filterProps.filterStyle as {
            isWithBackgroundAndBorder: boolean;
            style?: React.CSSProperties;
          },
        };

        return <Filters {...mappedProps} />;
      },
    },
  };
};
