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

import { CustomLoading } from '@/custom-table/components';
import type { TableContentProps } from '@/custom-table/types';
/**
 * CustomTable 主内容渲染组件
 * 基于 pro-components 设计模式优化
 *

 * @date 2025-12-19
 */
import type React from 'react';
import { useMemo } from 'react';

/**
 * @name 表格主内容组件
 * @description 负责渲染表格的完整内容结构，包括标题、筛选器、加载状态、表格主体和底部内容
 */
export const TableContent: React.FC<TableContentProps> = ({
  header,
  alertDom,
  filterDom,
  loadingConfig = {},
  renderers,
  tableDom,
  className = 'flex-1 flex flex-col gap-2',
  style,
}) => {
  const {
    useCustomLoading = false,
    loading = false,
    customLoading = false,
    tip = '加载中...',
  } = loadingConfig;

  /** @name 标题区域渲染 */
  const headerDom = useMemo(() => {
    const headerObj = header as
      | {
          title?: React.ReactNode;
          actions?: React.ReactNode;
          className?: string;
          style?: React.CSSProperties;
        }
      | undefined;
    if (
      !headerObj?.title &&
      !(Array.isArray(headerObj?.actions) && headerObj?.actions.length)
    ) {
      return null;
    }

    return (
      <div className={headerObj?.className} style={headerObj?.style}>
        {headerObj?.title && <div>{headerObj.title}</div>}
        {headerObj?.actions && <div>{headerObj.actions}</div>}
      </div>
    );
  }, [header]);

  /** @name 加载状态渲染 */
  const loadingDom = useMemo(() => {
    const shouldShowLoading = useCustomLoading && (loading || customLoading);
    if (!shouldShowLoading) {
      return null;
    }
    // 安全地将 tip 转换为字符串，确保类型安全
    let tipString = '加载中...';
    if (tip != null) {
      if (typeof tip === 'string') {
        tipString = tip;
      } else {
        // 如果不是字符串类型，使用默认值，避免类型转换问题
        tipString = '加载中...';
      }
    }
    return <CustomLoading tip={tipString} />;
  }, [useCustomLoading, loading, customLoading, tip]);

  /** @name 表格内容渲染 */
  const tableContentDom = useMemo(
    () => (renderers?.tableRender ? renderers.tableRender(tableDom) : null),
    [renderers, tableDom],
  );

  /** @name 底部内容渲染 */
  const footerDom = useMemo(() => {
    if (renderers?.footerRender) {
      // 兼容两种签名：() => ReactNode 和 (props) => ReactNode
      return (renderers.footerRender as any)({});
    }
    return null;
  }, [renderers]);

  return (
    <div className={className} style={style}>
      {headerDom}
      {alertDom}
      {filterDom}
      {loadingDom}
      {tableContentDom}
      {footerDom}
    </div>
  );
};
