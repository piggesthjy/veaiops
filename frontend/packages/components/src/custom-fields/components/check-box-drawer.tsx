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

import type { ModernTableColumnProps } from '@/shared/types';
import { Button, Drawer, Transfer } from '@arco-design/web-react';
import type { TransferItem } from '@arco-design/web-react/es/Transfer/interface';
import {
  type FC,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface CheckBoxDrawerProps<T = any> {
  /** 禁止选择的字段 */
  disabledFields: Map<string, string | undefined>;
  /** 基础的列 */
  columns: ModernTableColumnProps<T>[];
  /** 显/隐 */
  visible: boolean;
  /** 关闭 */
  close: () => void;
  /** 确认 */
  confirm: (value: string[]) => void;
  /** 当前值 */
  value: string[] | undefined;
  /** 标题 */
  title: string;
  /** 初始值 */
  initialValue?: string[];
}

const size = 'small';

/**
 * 自定义字段选择抽屉组件
 * 支持字段选择、排序、搜索等功能
 */
export const CheckBoxDrawer: FC<CheckBoxDrawerProps> = ({
  disabledFields,
  close,
  confirm,
  title,
  columns,
  value = [],
  visible,
}) => {
  const [dataSource, setDataSource] = useState<TransferItem[]>([]);
  const [currentValue, setCurrentValue] = useState<string[]>(value);

  // 转换数据源
  const transformDataSource = useCallback(
    (
      columns: ModernTableColumnProps[],
      value: string[],
      disabledFields: Map<string, string | undefined>,
    ): TransferItem[] =>
      columns.map((col) => ({
        key: col?.dataIndex as string,
        value: isValidElement(col?.title)
          ? (col?.title as any)?.props?.title
          : (col?.title as string),
        disabled: disabledFields.has(col?.dataIndex as string),
      })) || [],
    [],
  );

  // 排序拖拽项
  const sortDropItem = useCallback(
    <T extends TransferItem | string>(
      arr: Array<T>,
      dragIndex: number,
      dropIndex: number,
    ): Array<T> => {
      const cloneArr = [...arr];
      const isDesc = dropIndex > dragIndex;
      // 插入
      cloneArr.splice(isDesc ? dropIndex + 1 : dropIndex, 0, arr[dragIndex]);
      // 删除
      const delIndex = isDesc
        ? cloneArr.indexOf(arr[dragIndex])
        : cloneArr.lastIndexOf(arr[dragIndex]);
      cloneArr.splice(delIndex, 1);
      return cloneArr;
    },
    [],
  );

  // 搜索过滤
  const onSearch = useCallback(
    (inputValue: string, item: TransferItem) =>
      item?.key?.includes(inputValue) || item?.value?.includes(inputValue),
    [],
  );

  // 获取所有字段
  const getAllFieldKeys = useCallback(
    (columns: ModernTableColumnProps[]): string[] =>
      columns.map((col) => col?.dataIndex as string).filter(Boolean),
    [],
  );

  // 获取非禁用的字段
  const getEnabledFieldKeys = useCallback(
    (
      columns: ModernTableColumnProps[],
      disabledFields: Map<string, string | undefined>,
    ): string[] =>
      columns
        .map((col) => col?.dataIndex as string)
        .filter((key) => key && !disabledFields.has(key)),
    [],
  );

  const disabled = useMemo(
    () => !Array.isArray(currentValue) || currentValue.length === 0,
    [currentValue],
  );

  const setAll = useCallback(() => {
    const allValues = getAllFieldKeys(columns);
    setCurrentValue(allValues);
  }, [columns, getAllFieldKeys]);

  const resetDefault = useCallback(() => {
    const enabledValues = getEnabledFieldKeys(columns, disabledFields);
    setCurrentValue(enabledValues);
  }, [columns, disabledFields, getEnabledFieldKeys]);

  const onDrop = useCallback(
    ({
      dragItem,
      dropItem,
    }: {
      e: any;
      dragItem: TransferItem;
      dropItem: TransferItem;
      dropPosition: number;
    }) => {
      const sortedDataSource = sortDropItem<TransferItem>(
        dataSource,
        dataSource.indexOf(dragItem),
        dataSource.indexOf(dropItem),
      );
      const sortedCurrentValue = sortDropItem<string>(
        currentValue,
        currentValue.indexOf(dragItem.key),
        currentValue.indexOf(dropItem.key),
      );
      setDataSource(sortedDataSource);
      setCurrentValue(sortedCurrentValue);
    },
    [dataSource, currentValue, sortDropItem],
  );

  // 初始化数据源
  useEffect(() => {
    const newDataSource = transformDataSource(columns, value, disabledFields);
    setDataSource(newDataSource);
    setCurrentValue(value);
  }, [columns, value, disabledFields, transformDataSource]);

  // 更新当前值
  useEffect(() => {
    if (value !== currentValue) {
      setCurrentValue(value || []);
    }
  }, [value, currentValue]);

  const handleConfirm = useCallback(() => {
    confirm(currentValue);
    close();
  }, [confirm, currentValue, close]);

  const handleCancel = useCallback(() => {
    setCurrentValue(value);
    close();
  }, [value, close]);

  return (
    <Drawer
      title={title}
      className="custom-fields-transfer-wrap"
      visible={visible}
      onOk={handleConfirm}
      zIndex={1010}
      width={640}
      onCancel={handleCancel}
      closable={false}
      focusLock={false}
      okButtonProps={{
        size,
        disabled,
      }}
      cancelButtonProps={{ size }}
      cancelText="取消"
      okText="应用"
      unmountOnExit
    >
      <Transfer
        simple
        showSearch={{ allowClear: true }}
        filterOption={onSearch}
        draggable
        listStyle={{ width: 300, overflow: 'scroll' }}
        searchPlaceholder="搜索字段"
        showFooter={[
          <Button key="select_all" size="mini" type="text" onClick={setAll}>
            全选
          </Button>,
          false,
        ]}
        targetKeys={currentValue}
        dataSource={dataSource}
        titleTexts={[
          ({ countTotal }) => <span>待选择 {countTotal} 项</span>,
          ({ countTotal, clear }) => (
            <div className="flex-1 flex items-center justify-between">
              <span>已选择 {countTotal} 项</span>
              <Button type="text" icon={<span>🗑️</span>} onClick={clear} />
            </div>
          ),
        ]}
        onChange={(newTargetKeys, direction) => {
          if (newTargetKeys.length === 0 && direction === 'source') {
            resetDefault();
          } else {
            setCurrentValue(newTargetKeys);
          }
        }}
        onDrop={onDrop}
        render={(item) =>
          currentValue.includes(item.key) ? (
            <div className="flex items-center pr-2.5" key={item.key}>
              <span className="pr-2.5">{item.disabled && <span>🔒</span>}</span>
              {item.value}
            </div>
          ) : (
            <>{item.value}</>
          )
        }
      />
    </Drawer>
  );
};
