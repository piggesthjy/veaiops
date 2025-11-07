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

import { PluginNames, RendererNames } from '@/custom-table/constants/enum';
/**
 * CustomTable 组件渲染器
 * 负责渲染表格相关的各种组件
 */
import type React from 'react';
import { useCallback, useMemo } from 'react';

/**
 * 表格组件渲染器Hook的参数接口
 */
export interface UseTableRenderersParams<
  RecordType extends Record<string, unknown> = Record<string, unknown>,
> {
  pluginManager: Record<string, unknown>;
  context: Record<string, unknown>;
  state: {
    error?: Error | null;
    dataSource?: RecordType[];
    loadMoreData?: () => void;
  };
  props: {
    customRender?: {
      table?: (table: React.ReactNode) => React.ReactNode;
      footer?: (props: Record<string, unknown>) => React.ReactNode;
      [key: string]: unknown;
    };
    customComponentRender?: (props: {
      table: React.ReactNode;
    }) => React.ReactNode;
    customFooter?:
      | React.ReactNode
      | ((props: {
          hasMoreData: boolean;
          needContinue?: boolean;
          onLoadMore: () => void;
        }) => React.ReactNode);
  };
}

/**
 * 表格组件渲染器Hook
 */
export const useTableRenderers = <
  RecordType extends Record<string, unknown> = Record<string, unknown>,
>({
  pluginManager,
  context,
  state,
  props,
}: UseTableRenderersParams<RecordType>) => {
  const { error, dataSource, loadMoreData } = state;
  const { customRender, customComponentRender, customFooter } = props;

  // 空数据或错误状态元素
  const NoDataElement = useMemo(() => {
    if (error) {
      return (pluginManager.render as any)(
        PluginNames.DATA_SOURCE,
        RendererNames.ERROR_STATE,
        context,
      );
    }
    return (pluginManager.render as any)(
      PluginNames.DATA_SOURCE,
      RendererNames.EMPTY_STATE,
      context,
    );
  }, [pluginManager, context, error]);

  // 使用插件系统渲染组件
  const TableFilterComponent = useMemo(
    () =>
      (pluginManager.render as any)(
        PluginNames.TABLE_FILTER,
        RendererNames.FILTER,
        context,
      ),
    [pluginManager, context],
  );

  const AlertComponent = useMemo(
    () =>
      (pluginManager.render as any)(PluginNames.TABLE_ALERT, 'alert', context),
    [pluginManager, context],
  );

  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    if (loadMoreData) {
      loadMoreData();
    }
  }, [loadMoreData]);

  // 渲染表格内容
  const renderTableContent = useCallback(
    (tableComponent: React.ReactNode) => {
      // ⚠️ 不修改 context，只渲染内容
      if (customRender?.table) {
        return customRender.table(tableComponent);
      }
      if (customComponentRender) {
        return customComponentRender({ table: tableComponent });
      }
      return tableComponent;
    },
    [customRender, customComponentRender],
  );

  // 渲染底部内容
  const renderFooterContent = useCallback(() => {
    if (customRender?.footer) {
      return (
        <div className="flex my-1">
          {customRender.footer({
            hasMoreData: (dataSource as any)?.hasMoreData || false,
            needContinue: (dataSource as any)?.needContinue,
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
                hasMoreData: (dataSource as any)?.hasMoreData || false,
                needContinue: (dataSource as any)?.needContinue,
                onLoadMore: handleLoadMore,
              })
            : customFooter}
        </div>
      );
    }

    if (
      (dataSource as any)?.scrollFetchData &&
      (dataSource as any)?.hasMoreData
    ) {
      return (
        <div className="flex my-1">
          {(pluginManager.render as any)(
            PluginNames.DATA_SOURCE,
            RendererNames.LOAD_MORE_BUTTON,
            {
              ...context,
              helpers: {
                ...(context.helpers as any),
                loadMoreData: handleLoadMore,
              },
            },
          )}
        </div>
      );
    }

    return null;
  }, [
    customRender,
    customFooter,
    dataSource,
    handleLoadMore,
    pluginManager,
    context,
  ]);

  return {
    NoDataElement,
    TableFilterComponent,
    AlertComponent,
    handleLoadMore,
    renderTableContent,
    renderFooterContent,
  };
};
