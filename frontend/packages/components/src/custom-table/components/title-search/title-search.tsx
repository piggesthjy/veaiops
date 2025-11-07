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

// 公共组件
import { Message, Popover } from '@arco-design/web-react';
import { IconSearch } from '@arco-design/web-react/icon';
import { type FC, useEffect, useState } from 'react';

// 工具
import { useDebounceFn } from 'ahooks';
import { get, omit } from 'lodash-es';

// 常量// 样式

import type { TableColumnTitleProps } from '@/custom-table/types';
import { Tip } from '@/tip';
import { selectColor, unselectColor } from '@veaiops/constants';
import { NotFoundContent, NotFoundStatus } from '../not-found-content';
import { BaseSelectFooter } from './base-select-footer';
import styles from './base.module.less';
import type { SimpleOptions } from './typing';

const isSimpleOptions = (options: unknown): options is SimpleOptions =>
  Array.isArray(options) &&
  options.every(
    (opt: unknown) => typeof opt === 'number' || typeof opt === 'string',
  );
const TitleSearch: FC<TableColumnTitleProps> = ({
  title,
  dataIndex,
  filters,
  onChange,
  queryOptions,
  tip,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [options, setOptions] = useState<SimpleOptions>();
  const [notFoundStatus, setNotFoundStatus] = useState(NotFoundStatus.Default);

  const value = dataIndex
    ? (get(filters, dataIndex) as string[] | number[] | undefined)
    : undefined;
  const valueLength = Array.isArray(value) ? value.length : value ? 1 : 0;

  const { run: debouncedSearch } = useDebounceFn(
    async () => {
      try {
        // 1. 传入的queryOptions函数有问题
        if (typeof queryOptions !== 'function') {
          throw new Error();
        }

        // 2. 检索的字段为空字符串
        const str = inputValue?.trim();
        if (!str) {
          setOptions(undefined);
          setNotFoundStatus(NotFoundStatus.Default);
          return;
        }

        // 3. 检索的字符串有值
        setNotFoundStatus(NotFoundStatus.Start);
        const nextOptions = await queryOptions({
          inputValue: str,
          ...omit(filters, dataIndex ? [dataIndex] : []),
        });
        if (isSimpleOptions(nextOptions)) {
          setOptions(nextOptions);
          setNotFoundStatus(NotFoundStatus.NoData);
        } else {
          throw new Error();
        }
      } catch (error) {
        // 4. 如果发生错误
        const errorMessage =
          error instanceof Error ? error.message : '表头组件发生错误';
        Message.error(
          `表头组件title: ${title}, dataIndex: ${dataIndex} 发生错误: ${errorMessage}`,
        );
        setNotFoundStatus(NotFoundStatus.RequestFail);
        setOptions(undefined);
      }
    },
    { wait: 300 },
  );

  useEffect(() => {
    debouncedSearch();
  }, [inputValue, debouncedSearch]);

  const handleChange = (nextValue: unknown) => {
    if (!onChange || !dataIndex) {
      return;
    }
    // nextValue 可能是数组（多选模式）或单个值
    const normalizedValue = Array.isArray(nextValue)
      ? nextValue.length > 0
        ? nextValue[0]
        : null
      : (nextValue as string | number | null);
    if (normalizedValue) {
      onChange('filters', {
        [dataIndex]: normalizedValue,
      });
    } else {
      onChange('filters', {
        [dataIndex]: null,
      });
    }
  };

  return (
    <div className={styles.columnTitle}>
      <span className={styles.columnText}>
        {title}
        <Tip content={tip} />
      </span>
      <span className={styles.columnAction}>
        <Popover
          trigger={'click'}
          content={
            <BaseSelectFooter
              value={value}
              onSearch={setInputValue}
              onChange={handleChange}
              options={options}
              notFoundContent={
                <NotFoundContent notFoundStatus={notFoundStatus} />
              }
            />
          }
        >
          <IconSearch
            className={styles.icon}
            style={{ color: valueLength > 0 ? selectColor : unselectColor }}
          />
        </Popover>
      </span>
    </div>
  );
};

export { TitleSearch };
