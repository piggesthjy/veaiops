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

import type { CustomFieldsProps } from '@/custom-table/types';
import { Button } from '@arco-design/web-react';
import { IconSettings } from '@arco-design/web-react/icon';
/**
 * 带计数显示的 CustomFields 组件
 * 基于 stability 项目的实现
 */
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { CheckBoxDrawer } from './check-box-drawer';
import styles from './custom-fields-with-count.module.less';

const CustomFieldsWithCount = <T extends Record<string, unknown>>({
  disabledFields,
  columns,
  value = [],
  confirm,
}: CustomFieldsProps<T>): React.ReactElement => {
  const [visible, setVisible] = useState(false);

  /**
   * 递归计算列数量
   */
  const getColumnsCount = useCallback(
    <ColumnType extends { dataIndex?: string; children?: ColumnType[] }>(
      columns: ColumnType[],
    ): number => {
      let count = 0;
      columns?.forEach((column) => {
        // 如果当前列有 dataIndex，计数加1
        if (column.dataIndex) {
          count += 1;
        }
        // 如果有子列，递归计算子列数量
        if (column.children) {
          count += getColumnsCount(column.children);
        }
      });
      return count;
    },
    [],
  );

  /**
   * 计算可用列数量
   */
  const availableColumnsCount = useMemo(
    () => getColumnsCount(columns) - (value?.length || 0),
    [columns, value?.length, getColumnsCount],
  );

  return (
    <>
      <Button
        type="text"
        className="flex items-center gap-[5px]"
        key="custom-fields-with-count"
        onClick={() => setVisible(true)}
      >
        <IconSettings />
        <span>定制列</span>
        {availableColumnsCount > 0 && (
          <span className={styles.activeCount}>{availableColumnsCount}+</span>
        )}
      </Button>

      <CheckBoxDrawer
        title="定制列配置"
        disabledFields={disabledFields}
        columns={columns}
        visible={visible}
        close={() => setVisible(false)}
        value={value}
        confirm={confirm}
      />
    </>
  );
};

export { CustomFieldsWithCount };
