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

import {
  DEFAULT_FEATURES,
  DEFAULT_PLUGINS,
  FEATURE_PLUGIN_MAP,
  type FeatureFlags,
} from '@/custom-table/constants';
import { logCollector } from '@/custom-table/log-collector';
import {
  createPluginManager,
  initializePlugins,
} from '@/custom-table/plugins/plugin-system';
import type { Plugin } from '@/custom-table/types/plugins/core';
import { devLog } from '@/custom-table/utils/log-utils';
import type { BaseQuery, BaseRecord, PluginContext } from '@veaiops/types';
/**
 * CustomTable 插件管理 Hook
 */
import { useEffect, useMemo, useState } from 'react';

/**
 * 插件管理Hook
 */
const usePluginManager = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  props: {
    features?: Partial<FeatureFlags>;
    plugins?: string[];
  },
  context: PluginContext<RecordType, QueryType>,
) => {
  // 插件就绪状态
  const [pluginsReady, setPluginsReady] = useState(false);

  // 动态插件组合
  const activePlugins = useMemo(() => {
    if (props.plugins) {
      return props.plugins;
    }

    const features = { ...DEFAULT_FEATURES, ...props.features };
    const activePluginNames: string[] = [];

    // 根据功能开关动态组合插件
    Object.entries(features).forEach(([feature, enabled]) => {
      if (enabled && feature in FEATURE_PLUGIN_MAP) {
        const featureKey = feature;
        activePluginNames.push(
          ...(FEATURE_PLUGIN_MAP as Record<string, readonly string[]>)[
            featureKey
          ],
        );
      }
    });

    return activePluginNames;
  }, [props.features, props.plugins]);

  // 过滤默认插件 - 只保留活跃的插件
  const filteredPlugins = useMemo(
    () =>
      DEFAULT_PLUGINS.filter((plugin) => activePlugins.includes(plugin.name)),
    [activePlugins],
  );

  // 创建插件管理器 - 确保单例模式
  const pluginManager = useMemo(() => {
    const manager = createPluginManager();
    devLog.log({
      component: 'usePluginManager',
      message: 'Created plugin manager instance',
    });
    return manager;
  }, []);

  // 诊断日志：插件注册计数器（仅日志，不改变逻辑）
  const registerCounterRef = useMemo(() => {
    return new Map<string, number>();
  }, []);

  // 初始化插件 - 优化依赖项以减少重复初始化
  useEffect(() => {
    const initPlugins = async () => {
      try {
        devLog.log({
          component: 'usePluginManager',
          message: 'Initializing plugins:',
          data: {
            count: filteredPlugins.length,
            pluginNames: filteredPlugins.map((p) => p.name),
          },
        });

        // 重置插件就绪状态，防止并发初始化
        setPluginsReady(false);

        // 批量注册插件
        await Promise.all(
          filteredPlugins.map(async (plugin) => {
            // 诊断日志：统计插件注册次数（幂等校验仅日志）
            const key = plugin.name;
            const prev = registerCounterRef.get(key) || 0;
            registerCounterRef.set(key, prev + 1);
            devLog.log({
              component: 'usePluginManager',
              message: 'Plugin register attempt',
              data: {
                name: key,
                attempt: prev + 1,
                timestamp: Date.now(),
              },
            });

            await pluginManager.register(plugin);
            // 记录插件注册
            const pluginType = (plugin as Plugin & { type?: string }).type;
            logCollector.logPluginRegister({
              pluginName: plugin.name,
              pluginType: pluginType || 'unknown',
            });
            return plugin;
          }),
        );

        // 设置插件上下文
        filteredPlugins.forEach((plugin) => {
          pluginManager.setPluginContext({
            pluginName: plugin.name,
            context: context as any,
          });
        });

        // 初始化插件
        const initResult = await initializePlugins(
          pluginManager,
          context as any,
        );
        if (initResult.success) {
          devLog.log({
            component: 'usePluginManager',
            message: 'All plugins initialized successfully',
          });
          // 记录插件初始化
          filteredPlugins.forEach((plugin) => {
            logCollector.logPluginInit({ pluginName: plugin.name });
          });
          setPluginsReady(true);
        } else if (initResult.error) {
          // ✅ 正确：根据返回结果判断，错误信息已在 initializePlugins 中记录
          // 部分插件初始化失败，但仍设置 ready 为 true（因为其他插件可能已成功初始化）
          devLog.warn({
            component: 'usePluginManager',
            message: '部分插件初始化失败',
            data: {
              error: initResult.error.message,
              pluginNames: filteredPlugins.map((p) => p.name),
            },
          });
          setPluginsReady(true); // 允许继续，因为部分插件可能已成功
        }
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        // ✅ 正确：透出实际错误信息
        devLog.error({
          component: 'usePluginManager',
          message: 'Plugin init failed',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
            pluginNames: filteredPlugins.map((p) => p.name),
          },
        });
        setPluginsReady(false);
      }
    };

    // 只在必要时重新初始化
    if (filteredPlugins.length > 0) {
      initPlugins();
    }
  }, [pluginManager, filteredPlugins, registerCounterRef]); // 包含 registerCounterRef 依赖

  // 在上下文变化时更新插件上下文，并重跑各插件的 setup 以便注入 helpers
  useEffect(() => {
    const rebindContextAndSetup = async () => {
      if (!pluginsReady || filteredPlugins.length === 0) {
        return;
      }

      devLog.log({
        component: 'usePluginManager',
        message: 'Rebind context & setup',
        data: {
          pluginsReady,
          pluginCount: filteredPlugins.length,
          timestamp: Date.now(),
        },
      });

      // 1) 更新插件上下文，绑定最新 helpers/state 引用
      filteredPlugins.forEach((plugin) => {
        pluginManager.setPluginContext({
          pluginName: plugin.name,
          context: context as any,
        });
      });

      // 2) 重新执行各插件的 setup，确保像 detectAndSaveColumnWidths 之类的方法注入到 helpers
      for (const plugin of filteredPlugins) {
        try {
          const maybeSetup = (
            plugin as unknown as {
              setup?: (ctx: PluginContext<BaseRecord, BaseQuery>) => unknown;
            }
          ).setup;
          if (typeof maybeSetup === 'function') {
            await maybeSetup(
              context as unknown as PluginContext<BaseRecord, BaseQuery>,
            );
          }
        } catch (error: unknown) {
          const errorObj =
            error instanceof Error ? error : new Error(String(error));
          // ✅ 正确：透出实际错误信息
          devLog.error({
            component: 'usePluginManager',
            message: 'Plugin setup error',
            data: {
              name: (plugin as any)?.name,
              error: errorObj.message,
              stack: errorObj.stack,
              errorObj,
            },
          });
        }
      }
    };

    rebindContextAndSetup();
  }, [context, pluginsReady, filteredPlugins, pluginManager]);

  return {
    pluginManager,
    activePlugins,
    filteredPlugins,
    pluginsReady,
  };
};

export { usePluginManager };
