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

import { PluginNames, RendererNames } from '@/custom-table/constants';
import type {
  BaseQuery,
  BaseRecord,
  PluginContext,
  PluginManager,
  TableDataSource,
} from '@/custom-table/types';
import { devLog } from '@/custom-table/utils/log-utils';
/**
 * CustomTable 渲染器 Hook
 * 负责处理各种组件的渲染逻辑
 *

 * @date 2025-12-19
 */
import React, { useMemo, useCallback } from 'react';

/**
 * @name 渲染器方法集合
 */
export interface TableRenderers {
  /** @name 无数据元素渲染器 */
  NoDataElement: React.ReactNode;
  /** @name 表格筛选组件渲染器 */
  TableFilterComponent: React.ReactNode;
  /** @name 警告组件渲染器 */
  AlertComponent: React.ReactNode;
  /** @name 表格内容渲染器 */
  renderTableContent: (tableComponent: React.ReactNode) => React.ReactNode;
  /** @name 底部内容渲染器 */
  renderFooterContent: () => React.ReactNode;
}

/**
 * @name 创建表格渲染器集合
 * @description 基于插件系统创建各种渲染器方法
 */
const useCustomTableRenderers = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  context: PluginContext<RecordType, QueryType>,
  pluginManager: PluginManager,
  dataSource?: any,
  pluginsReady?: boolean, // 新增插件就绪状态参数
): TableRenderers => {
  const {
    state: { error },
    props: { customComponentRender, customFooter },
  } = context as any;

  // 组件渲染器 - 内联实现
  const NoDataElement = useMemo(() => {
    try {
      let dataElement;
      if (error) {
        dataElement = pluginManager.render({
          pluginName: PluginNames.DATA_SOURCE,
          renderer: RendererNames.ERROR_STATE,
          args: [context],
        });
      } else {
        dataElement = pluginManager.render({
          pluginName: PluginNames.DATA_SOURCE,
          renderer: RendererNames.EMPTY_STATE,
          args: [context],
        });
      }

      // 如果渲染结果是有效的React元素，包装在Fragment中以避免Context问题
      if (React.isValidElement(dataElement)) {
        return (
          <React.Fragment key="data-wrapper">{dataElement}</React.Fragment>
        );
      }

      return dataElement;
    } catch (error: unknown) {
      devLog.warn({
        component: 'useCustomTableRenderers',
        message: '渲染TableDataComponent失败',
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return null;
    }
  }, [pluginManager, context, error]);

  const TableFilterComponent = useMemo(() => {
    // 只有在插件就绪时才渲染
    if (!pluginsReady) {
      return null;
    }

    try {
      const filterComponent = pluginManager.render({
        pluginName: PluginNames.TABLE_FILTER,
        renderer: RendererNames.FILTER,
        args: [context],
      });

      // 如果渲染结果是有效的React元素，包装在Fragment中以避免Context问题
      if (React.isValidElement(filterComponent)) {
        return (
          <React.Fragment key="filter-wrapper">
            {filterComponent}
          </React.Fragment>
        );
      }

      return filterComponent;
    } catch (error: unknown) {
      devLog.warn({
        component: 'useCustomTableRenderers',
        message: '渲染TableFilterComponent失败',
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return null;
    }
  }, [pluginManager, context, pluginsReady]);

  const AlertComponent = useMemo(() => {
    // 只有在插件就绪时才渲染
    if (!pluginsReady) {
      devLog.log({
        component: 'useCustomTableRenderers',
        message: '🚨 插件未就绪，AlertComponent返回null',
      });
      return null;
    }

    try {
      devLog.log({
        component: 'useCustomTableRenderers',
        message: '🚨 开始渲染AlertComponent',
      });

      // 直接调用插件渲染方法，添加详细调试信息
      const alertComponent = pluginManager.render({
        pluginName: PluginNames.TABLE_ALERT,
        renderer: 'alert',
        args: [context],
      });

      devLog.log({
        component: 'useCustomTableRenderers',
        message: '🚨 AlertComponent渲染结果:',
        data: {
          alertComponent,
          alertComponentType: typeof alertComponent,
          isValidElement: React.isValidElement(alertComponent),
          isReactElement: React.isValidElement(alertComponent),
          alertComponentKeys:
            alertComponent && typeof alertComponent === 'object'
              ? Object.keys(alertComponent)
              : 'N/A',
        },
      });

      return alertComponent;
    } catch (error: unknown) {
      devLog.warn({
        component: 'useCustomTableRenderers',
        message: '渲染AlertComponent失败',
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return null;
    }
  }, [pluginManager, context, pluginsReady]);

  const handleLoadMore = useCallback(() => {
    if (context.helpers.loadMoreData) {
      context.helpers.loadMoreData();
    }
  }, [context.helpers]);

  const renderTableContent = useCallback(
    (tableComponent: React.ReactNode) => {
      if (context.props.customRender?.table) {
        return context.props.customRender.table(tableComponent);
      }
      if (
        customComponentRender &&
        typeof customComponentRender === 'function'
      ) {
        return customComponentRender({ table: tableComponent });
      }
      return tableComponent;
    },
    [context.props.customRender, customComponentRender],
  );

  const renderFooterContent = useCallback(() => {
    if (context.props.customRender?.footer) {
      return (
        <div className="flex my-1">
          {context.props.customRender.footer({
            hasMoreData: dataSource?.hasMoreData || false,
            needContinue: dataSource?.needContinue,
            onLoadMore: handleLoadMore,
          })}
        </div>
      );
    }

    if (customFooter) {
      return (
        <div className="flex my-1">
          {typeof customFooter === 'function'
            ? customFooter({
                hasMoreData: dataSource?.hasMoreData || false,
                needContinue: dataSource?.needContinue,
                onLoadMore: handleLoadMore,
              })
            : customFooter}
        </div>
      );
    }

    if (dataSource?.scrollFetchData && dataSource?.hasMoreData) {
      try {
        const loadMoreButton = pluginManager.render({
          pluginName: PluginNames.DATA_SOURCE,
          renderer: RendererNames.LOAD_MORE_BUTTON,
          args: [
            {
              ...context,
              helpers: {
                ...context.helpers,
                loadMoreData: handleLoadMore,
              },
            },
          ],
        });

        return (
          <div className="flex my-1">
            {React.isValidElement(loadMoreButton) ? (
              <React.Fragment key="loadmore-wrapper">
                {loadMoreButton}
              </React.Fragment>
            ) : (
              loadMoreButton
            )}
          </div>
        );
      } catch (error: unknown) {
        devLog.warn({
          component: 'useCustomTableRenderers',
          message: '渲染LoadMoreButton失败',
          data: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
        return null;
      }
    }

    return null;
  }, [context, customFooter, dataSource, handleLoadMore, pluginManager]);

  return {
    NoDataElement,
    TableFilterComponent,
    AlertComponent,
    renderTableContent,
    renderFooterContent,
  };
};

export { useCustomTableRenderers };
