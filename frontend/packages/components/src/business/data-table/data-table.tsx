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
  Button,
  Modal,
  Space,
  Table,
  Typography,
} from '@arco-design/web-react';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import { useMemo } from 'react';
import type { ActionConfig, ColumnConfig, DataTableProps } from './types';

const { Text } = Typography;

/**
 * 通用数据表格组件
 * @description 提供标准化的数据表格功能，支持操作列、分页、选择等


 */
export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  actions = [],
  actionTitle = '操作',
  actionWidth = 200,
  showIndex = false,
  indexTitle = '序号',
  rowSelection,
  rowKey = 'id',
  emptyText = '暂无数据',
  size = 'default',
  border = true,
  stripe = true,
  title,
  footer,
  ...tableProps
}: DataTableProps<T>) => {
  // 转换列配置为Arco Table列配置
  const tableColumns = useMemo<ColumnProps[]>(() => {
    const cols: ColumnProps[] = [];

    // 添加序号列
    if (showIndex) {
      cols.push({
        title: indexTitle,
        width: 80,
        render: (_: any, __: any, index: number) => {
          const current =
            pagination && typeof pagination === 'object'
              ? pagination.current || 1
              : 1;
          const pageSize =
            pagination && typeof pagination === 'object'
              ? pagination.pageSize || 10
              : 10;
          return (current - 1) * pageSize + index + 1;
        },
      });
    }

    // 添加数据列
    columns.forEach((col: ColumnConfig<T>) => {
      const tableCol: ColumnProps = {
        title: col.title,
        dataIndex: col.dataIndex as string,
        width: col.width,
        align: col.align,
        fixed: col.fixed,
        render: col.render,
      };

      // 添加排序
      if (col.sortable) {
        tableCol.sorter = true;
      }

      // 添加筛选
      if (col.filterable && col.dataIndex) {
        // 从数据中提取唯一值作为筛选选项
        const uniqueValues = Array.from(
          new Set(data.map((item) => item[col.dataIndex as keyof T])),
        ).filter(Boolean);

        tableCol.filters = uniqueValues.map((value) => ({
          text: String(value),
          value,
        }));

        tableCol.onFilter = (value, record) => {
          return record[col.dataIndex as keyof T] === value;
        };
      }

      cols.push(tableCol);
    });

    // 添加操作列
    if (actions.length > 0) {
      cols.push({
        title: actionTitle,
        width: actionWidth,
        fixed: 'right',
        render: (_: any, record: T, index: number) => (
          <Space size="small">
            {actions.map((action: ActionConfig<T>, actionIndex: number) => {
              // 检查是否显示
              if (action.visible && !action.visible(record)) {
                return null;
              }

              // 检查是否禁用
              const disabled = action.disabled
                ? action.disabled(record)
                : false;

              const button = (
                <Button
                  key={actionIndex}
                  type={action.type || 'text'}
                  status={action.status}
                  size="small"
                  icon={action.icon}
                  disabled={disabled}
                  onClick={() => {
                    if (action.confirm) {
                      Modal.confirm({
                        title: action.confirm.title,
                        content: action.confirm.content,
                        onOk: () => action.onClick(record, index),
                      });
                    } else {
                      action.onClick(record, index);
                    }
                  }}
                >
                  {action.text}
                </Button>
              );

              return button;
            })}
          </Space>
        ),
      });
    }

    return cols;
  }, [
    columns,
    actions,
    data,
    showIndex,
    indexTitle,
    actionTitle,
    actionWidth,
    pagination,
  ]);

  // 处理分页配置
  const paginationConfig = useMemo(() => {
    if (pagination === false) {
      return false;
    }

    if (typeof pagination === 'object') {
      return {
        current: pagination.current || 1,
        pageSize: pagination.pageSize || 10,
        total: pagination.total || data.length,
        showTotal: pagination.showTotal
          ? (total: number, range: number[]): string =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          : undefined,
        showJumper: pagination.showJumper,
        sizeCanChange: pagination.sizeCanChange,
        pageSizeOptions: pagination.pageSizeOptions || [10, 20, 50, 100],
        onChange: pagination.onChange,
        onPageSizeChange: pagination.onChange,
      };
    }

    // 默认分页配置
    return {
      pageSize: 10,
      showTotal: (total: number, range: number[]): string =>
        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      showJumper: true,
      sizeCanChange: true,
      pageSizeOptions: [10, 20, 50, 100],
    };
  }, [pagination, data.length]);

  // 处理行选择配置
  const rowSelectionConfig = useMemo(() => {
    if (!rowSelection) {
      return undefined;
    }

    return {
      type: rowSelection.type || 'checkbox',
      selectedRowKeys: rowSelection.selectedRowKeys || [],
      onChange: rowSelection.onChange as any,
      checkboxProps: rowSelection.checkboxProps,
    };
  }, [rowSelection]);

  return (
    <div>
      {title && (
        <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 'bold' }}>
          {title}
        </div>
      )}
      <Table
        {...tableProps}
        columns={tableColumns}
        data={data}
        loading={loading}
        pagination={paginationConfig}
        rowSelection={rowSelectionConfig}
        rowKey={rowKey}
        size={size}
        border={border}
        stripe={stripe}
        footer={footer ? () => footer : undefined}
        noDataElement={
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Text type="secondary">{emptyText}</Text>
          </div>
        }
      />
    </div>
  );
};

export type {
  ActionConfig,
  ColumnConfig,
  DataTableProps,
  PaginationConfig,
} from './types';
