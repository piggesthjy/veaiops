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

import baseStyles from '@/custom-table/base.module.less';
import { Tip } from '@/tip';
import { Empty, Link, Message, Spin } from '@arco-design/web-react';
import { IconFilter } from '@arco-design/web-react/icon';
import { selectColor, unselectColor } from '@veaiops/constants';
import type { Option, TableColumnTitleProps } from '@veaiops/types';
import { get, isNil } from 'lodash-es';
import { type FC, useCallback, useMemo, useState } from 'react';
import { BaseSelectFooter as BaseMultiSelectFooter } from './_base-multi-select-footer';
import { BaseSelectFooter as BaseSingleSelectFooter } from './_base-single-select-footer';
import {
  getArrayTypeOptions,
  isArrayOptions,
  isNormalOptions,
  isOptions,
} from './utils';

// 从命名空间获取常量和组件

const useFrontEnumsOptions = (_frontEnum?: unknown) => ({
  data: [],
  loading: false,
  error: null,
  options: [],
});

const TitleFilter: FC<TableColumnTitleProps> = ({
  title,
  dataIndex,
  filters,
  onChange,
  queryOptions,
  tip,
  multiple = false, // 默认改为单选，与最新版本保持一致
  style,
  showTip = false, // 默认不显示Tip，保持向后兼容
  frontEnum, // 新增：支持直接传入FrontEnum
}) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Option[]>();

  // 使用 useFrontEnumsOptions 获取枚举选项 - 必须在条件外调用
  const frontEnumOptions = useFrontEnumsOptions(frontEnum);

  // 获取值
  const value = get(filters, dataIndex);

  // 颜色
  const color = useMemo(() => {
    if (typeof value === 'string' && value !== '') {
      return selectColor;
    }
    if (typeof value === 'number') {
      return selectColor;
    }

    if (Array.isArray(value) && value.length > 0) {
      return selectColor;
    }

    return unselectColor;
  }, [value]);

  // 获取options的方法
  const getOptions = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ 优先使用 frontEnum 获取选项
      if (frontEnum && frontEnumOptions) {
        const enumOptions = Array.isArray(frontEnumOptions)
          ? frontEnumOptions[0]?.options
          : frontEnumOptions.options;

        if (enumOptions) {
          setOptions(enumOptions as Option[]);
          setLoading(false);
          return;
        }
      }

      // 兜底使用 queryOptions
      if (typeof queryOptions !== 'function') {
        throw new Error('未传入queryOptions或frontEnum');
      }

      // 目前的查询函数都没有传入参数
      const nextOptions = await queryOptions({
        dataIndex,
      });

      if (isArrayOptions(nextOptions)) {
        setOptions(getArrayTypeOptions(nextOptions));
      } else if (isOptions(nextOptions)) {
        setOptions(nextOptions);
      } else if (isNormalOptions(nextOptions)) {
        setOptions(
          nextOptions.map((option: string | number) => ({
            value: option,
            label: String(option),
          })),
        );
      } else {
        throw new Error();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Message.error(
        `表头组件 title: ${
          typeof title === 'string' ? title : '[ReactNode]'
        }, dataIndex: ${dataIndex} 发生错误：${errorMessage}`,
      );
      setOptions(undefined);
    } finally {
      setLoading(false);
    }
  }, [queryOptions, dataIndex, title, frontEnum, frontEnumOptions]);

  // 改变函数
  const handleChange = (nextValue?: (string | number)[] | string | number) => {
    if (isNil(nextValue)) {
      onChange('filters', {
        [dataIndex]: null,
      });
    } else {
      onChange('filters', {
        [dataIndex]: nextValue,
      });
    }
  };

  // 获取基本的选择函数
  const BaseSelectFooter = multiple
    ? BaseMultiSelectFooter
    : BaseSingleSelectFooter;

  return (
    <div className={baseStyles.columnTitle} style={style}>
      {title && (
        <span className={baseStyles.columnText}>
          {title} {showTip && tip && <Tip content={tip} />}
        </span>
      )}
      <span className={baseStyles.columnAction}>
        <BaseSelectFooter
          options={options}
          value={value}
          onChange={handleChange}
          loading={loading}
          onVisibleChange={(visible) => {
            if (visible) {
              setLoading(true);
              getOptions();
            } else {
              setOptions(undefined);
            }
          }}
          notFoundContent={
            loading ? (
              <div className={baseStyles.loading}>
                <Spin className={baseStyles.spin} />
              </div>
            ) : (
              <Empty />
            )
          }
          triggerElement={
            <Link className={baseStyles.iconBox}>
              <IconFilter className={baseStyles.icon} style={{ color }} />
            </Link>
          }
        />
      </span>
    </div>
  );
};

export { TitleFilter };
