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

import { CustomTable } from '@veaiops/components';
import { logger, queryNumberFormat } from '@veaiops/utils';
import type { MetricTemplate } from 'api-generate';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useMetricTemplateTableConfig } from '../hooks/use-table-config';

const queryFormat = {
  metricType: queryNumberFormat,
};
/**
 * 指标模板表格组件属性接口
 */
interface MetricTemplateTableProps {
  onEdit: (template: MetricTemplate) => Promise<boolean>;
  onDelete: (templateId: string) => Promise<boolean>;
  onCreate: () => Promise<boolean>;
  onRefreshReady?: (refresh: () => Promise<boolean>) => void;
}

/**
 * 指标模板表格组件
 * 封装表格的渲染逻辑，提供清晰的接口
 */
export const MetricTemplateTable: React.FC<MetricTemplateTableProps> = ({
  onEdit,
  onDelete,
  onCreate,
  onRefreshReady,
}) => {
  // CustomTable ref 用于调用 refresh 方法
  const tableRef = useRef<any>(null);

  // 表格配置 - 内聚操作按钮配置
  const { customTableProps, handleColumns, handleFilters, actionButtons } =
    useMetricTemplateTableConfig({
      onEdit,
      onDelete,
      onCreate,
    });

  // 暴露刷新方法给父组件
  useEffect(() => {
    if (onRefreshReady && tableRef.current?.refresh) {
      // 包装 CustomTable 的 refresh 方法
      const wrappedRefresh = async () => {
        logger.debug({
          message: '刷新方法被调用',
          data: {},
          source: 'MetricTemplateTable',
          component: 'wrappedRefresh',
        });
        await tableRef.current.refresh();
        logger.debug({
          message: '刷新完成',
          data: {},
          source: 'MetricTemplateTable',
          component: 'wrappedRefresh',
        });
        return true;
      };
      onRefreshReady(wrappedRefresh);
      logger.debug({
        message: '刷新方法已注册到父组件',
        data: {},
        source: 'MetricTemplateTable',
        component: 'useEffect',
      });
    }
  }, [onRefreshReady]);

  return (
    <CustomTable<MetricTemplate>
      ref={tableRef}
      title="指标模板管理"
      handleColumns={handleColumns}
      handleFilters={handleFilters}
      syncQueryOnSearchParams
      useActiveKeyHook
      actions={actionButtons}
      queryFormat={queryFormat}
      tableClassName="metric-template-table"
      {...customTableProps}
    />
  );
};
