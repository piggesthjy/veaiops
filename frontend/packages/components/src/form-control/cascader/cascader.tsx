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

import { commonCascaderProps } from '@/constants';
import { Cascader } from '@arco-design/web-react';
import { useDeepCompareEffect, useMount } from 'ahooks';
import { type FC, useState } from 'react';

export interface CascaderOption {
  label: string;
  value: string | number;
  children?: CascaderOption[];
  disabled?: boolean;
}

export interface CascaderBlockProps {
  options?: CascaderOption[];
  dataSource?: (params: any) => Promise<CascaderOption[]>;
  value?: (string | string[])[];
  onChange?: (
    value: (string | string[])[],
    selectedOptions?: CascaderOption[],
  ) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  loading?: boolean;
  [key: string]: any;
}

const CascaderBlock: FC<CascaderBlockProps> = (props: CascaderBlockProps) => {
  // 解构属性对象，获取 options 和 dataSource 属性，并将剩余属性赋值给 rest 变量
  const { options: initialOptions = [], dataSource, ...rest } = props;

  const [options, setOptions] = useState<CascaderOption[]>(initialOptions);

  const [loading, setLoading] = useState<boolean>(false);

  // 定义 retrieveDataSource 异步函数，用于获取数据源
  const retrieveDataSource = async () => {
    if (!dataSource) {
      return;
    }
    setLoading(true);
    try {
      const newOptions = await dataSource({});
      setOptions(newOptions);
    } catch (error: unknown) {
      // 记录错误但不中断流程，级联选择器的数据加载失败不应影响整体
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      console.error('[CascaderBlock] 数据源加载失败:', errorObj);
    } finally {
      setLoading(false);
    }
  };

  // 使用 useDeepCompareEffect 钩子来处理 initialOptions 的深比较副作用
  useDeepCompareEffect(() => {
    if (!initialOptions) {
      return;
    }
    setOptions(initialOptions);
  }, [initialOptions]);

  // 使用 useMount 钩子来处理组件挂载时的副作用
  useMount(async () => {
    await retrieveDataSource();
  });

  return (
    <Cascader
      {...commonCascaderProps}
      loading={loading}
      options={options}
      {...rest}
    />
  );
};

export { CascaderBlock };
