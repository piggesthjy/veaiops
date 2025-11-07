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
import type { PluginContext, PluginFactory } from '@/custom-table/types';
import { PluginPriorityEnum } from '@/custom-table/types/core/enums';
import type { DataSourceConfig } from '@/custom-table/types/plugins/data-source';
import { Empty } from '@arco-design/web-react';
import { IconSearch } from '@arco-design/web-react/icon';
/**
 * 数据源插件实现
 */
import type React from 'react';
import { DEFAULT_DATA_SOURCE_CONFIG } from './config';

/**
 * 数据源插件工厂函数
 */
export const DataSourcePlugin: PluginFactory<DataSourceConfig> = (
  config: Partial<DataSourceConfig> = {},
) => {
  const finalConfig: DataSourceConfig = {
    ...DEFAULT_DATA_SOURCE_CONFIG,
    ...config,
  };

  return {
    name: PluginNames.DATA_SOURCE,
    version: '1.0.0',
    description: '表格监控数据源管理插件',
    priority: finalConfig.priority || PluginPriorityEnum.HIGH,
    enabled: finalConfig.enabled !== false,
    dependencies: [],
    conflicts: [],
    config: finalConfig,

    install(_context: PluginContext) {
      // 安装时的操作
    },

    setup(context: PluginContext) {
      // 插件设置逻辑 - 不调用 Hook，只进行配置
      // Hook 调用已移到 useCustomTable 中
      // 存储配置到状态中，而不是直接返回
      Object.assign(context.state, {
        hookConfig: {
          dataSource: context.props.dataSource,
          config: finalConfig,
        },
      });
    },

    update(_context: PluginContext) {
      // 当配置或数据更新时的操作
    },

    uninstall(_context: PluginContext) {
      // 卸载时的清理操作
    },

    // 数据处理钩子
    hooks: {
      // 加载数据的钩子
      loadData(...args: unknown[]) {
        const context = args[0] as PluginContext;
        if (context.helpers.run) {
          context.helpers.run();
        }
      },

      // 重置数据的钩子
      resetData(...args: unknown[]) {
        const context = args[0] as PluginContext;
        if (context.helpers.reset) {
          context.helpers.reset({ resetEmptyData: true });
        }
      },

      // 加载更多数据的钩子
      loadMore(...args: unknown[]) {
        const context = args[0] as PluginContext;
        if (context.helpers.loadMoreData) {
          context.helpers.loadMoreData();
        }
      },
    },

    // 渲染方法 - 根据上下文动态渲染内容
    render: {
      // 空状态渲染器（对齐 RendererNames.EMPTY_STATE）
      emptyState(context: PluginContext) {
        const props = context.props as unknown as {
          noDataElement?: React.ReactNode;
        };
        // 优先使用外部传入的 noDataElement
        if (props.noDataElement) {
          return props.noDataElement;
        }
        return <Empty description="暂无数据" style={{ padding: '40px 0' }} />;
      },

      // 错误状态渲染器（对齐 RendererNames.ERROR_STATE）
      errorState(context: PluginContext) {
        const props = context.props as unknown as {
          noDataElement?: React.ReactNode;
        };
        if (props.noDataElement) {
          return props.noDataElement;
        }
        return <Empty description="请求失败" style={{ padding: '40px 0' }} />;
      },
      footer(context: PluginContext) {
        const props = context.props as unknown as {
          dataSource?: {
            scrollFetchData?: boolean;
            hasMoreData?: boolean;
            needContinue?: boolean;
          };
          noDataElement?: React.ReactNode;
          customFooter?:
            | React.ReactNode
            | ((params: {
                hasMoreData?: boolean;
                needContinue?: boolean;
                loadMoreData?: () => void;
                onLoadMore?: () => void;
              }) => React.ReactNode);
        };
        const { dataSource } = props;
        const { loadMoreData } = context.helpers;

        // 如果有错误，渲染错误状态
        if (context.state.error) {
          return (
            props.noDataElement || (
              <Empty description="请求失败" style={{ padding: '40px 0' }} />
            )
          );
        }

        // 如果需要加载更多，渲染加载更多按钮
        if (dataSource?.scrollFetchData && dataSource?.hasMoreData) {
          if (props.customFooter) {
            if (typeof props.customFooter === 'function') {
              return props.customFooter({
                hasMoreData: dataSource.hasMoreData,
                needContinue: dataSource.needContinue,
                onLoadMore:
                  loadMoreData ||
                  (() => {
                    // 加载更多数据
                  }),
              });
            }
            return props.customFooter;
          }

          return (
            <div
              className="w-full text-center custom-table-footer"
              style={{ color: '#80838a' }}
              onClick={loadMoreData || undefined}
            >
              <IconSearch />
              {dataSource?.needContinue ? '继续搜索更多数据' : '加载更多'}
            </div>
          );
        }

        // 默认渲染空数据状态
        return (
          props.noDataElement || (
            <Empty description="暂无数据" style={{ padding: '40px 0' }} />
          )
        );
      },

      // 加载更多按钮（对齐 RendererNames.LOAD_MORE_BUTTON）
      loadMoreButton(context: PluginContext) {
        const props = context.props as unknown as {
          dataSource?: {
            scrollFetchData?: boolean;
            hasMoreData?: boolean;
            needContinue?: boolean;
          };
        };
        const { dataSource } = props;
        const { loadMoreData } = context.helpers;
        if (!dataSource?.scrollFetchData || !dataSource?.hasMoreData) {
          return null;
        }
        return (
          <div
            className="w-full text-center custom-table-footer"
            style={{ color: '#80838a' }}
            onClick={loadMoreData || undefined}
          >
            <IconSearch />
            {dataSource?.needContinue ? '继续搜索更多数据' : '加载更多'}
          </div>
        );
      },
    },
  };
};
