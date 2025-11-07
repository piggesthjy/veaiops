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

import { useDeepCompareEffect } from 'ahooks';
import { isEmpty } from 'lodash-es';
import { useEffect, useMemo, useRef } from 'react';
import { logger } from '../logger';
import type { DataFetcherPluginImpl } from '../plugins/data-fetcher';
import type {
  EnumOptionConfigs,
  SelectOption,
  VeArchSelectBlockProps,
} from '../types/interface';
import type { PluginContext, SelectBlockState } from '../types/plugin';
import { getFrontEnumsOptions } from '../util';

// 定义带有内部context访问的DataFetcher接口
interface DataFetcherWithContext {
  context: PluginContext;
}

/**
 * 选项处理Hook
 * 负责选项的计算、合并、过滤和最终值的处理
 */
export function useOptionsProcessing(
  props: VeArchSelectBlockProps,
  currentState: SelectBlockState,
  dataFetcher: DataFetcherPluginImpl | undefined,
) {
  const {
    options: initialOptions = [],
    enumOptionConfig = { key: '' } as EnumOptionConfigs,
    defaultValue,
    value,
    dependency,
    defaultActiveFirstOption = false,
    mode,
    dataSource,
    dataSourceShare = false,
    isFirstHint = false,
    canFetch = true,
    isCascadeRemoteSearch = true,
    isValueEmptyTriggerOptions = true,
    searchKey,
    remoteSearchKey,
    multiSearchKeys = [],
    handleOptions = ({ options }: { options: SelectOption[] }) => options,
    onOptionsChange,
  } = props;

  // 用于跟踪上一个value值的引用
  const prevValueRef = useRef(value);

  // 获取前端枚举选项
  const { options: enumOptions } = getFrontEnumsOptions(
    enumOptionConfig?.key
      ? enumOptionConfig
      : { ...enumOptionConfig, key: enumOptionConfig.key || '' },
  );

  // 判断是否应该根据defaultValue获取选项
  const shouldFetchOptionsWithDefaultValue = useMemo(
    () =>
      Boolean(
        isCascadeRemoteSearch &&
          (searchKey || remoteSearchKey) &&
          (isValueEmptyTriggerOptions ? true : !isEmpty(value)),
      ),
    [
      isCascadeRemoteSearch,
      isValueEmptyTriggerOptions,
      remoteSearchKey,
      searchKey,
      value,
    ],
  );

  // 判断是否可以获取数据
  const _canFetch = useMemo(() => {
    const result = (() => {
      if (!canFetch) {
        return false;
      }
      if (searchKey || remoteSearchKey || multiSearchKeys?.length > 0) {
        return shouldFetchOptionsWithDefaultValue;
      }
      return true;
    })();

    // 🔧 添加 _canFetch 计算日志
    logger.debug(
      'UseOptionsProcessing',
      '_canFetch 计算',
      {
        result,
        canFetch,
        hasSearchKey: Boolean(searchKey),
        hasRemoteSearchKey: Boolean(remoteSearchKey),
        multiSearchKeysLength: multiSearchKeys?.length || 0,
        shouldFetchOptionsWithDefaultValue,
        hasDataSource: Boolean(dataSource),
        dataSourceType: typeof dataSource,
        dataSourceApi:
          typeof dataSource === 'object' &&
          dataSource !== null &&
          'api' in dataSource
            ? (dataSource as any).api
            : undefined,
      },
      'useMemo_canFetch',
    );

    return result;
  }, [
    searchKey,
    remoteSearchKey,
    multiSearchKeys,
    canFetch,
    shouldFetchOptionsWithDefaultValue,
    dataSource,
  ]);

  // 计算value是否从有值变为空值的状态
  const shouldFetchDueToValueEmpty = useMemo(() => {
    const prevValueEmpty = isEmpty(prevValueRef.current);
    const currentValueEmpty = isEmpty(value);
    // 只有当value从有值变为空值，且满足其他条件时才需要触发重新获取
    return (
      !prevValueEmpty &&
      currentValueEmpty &&
      _canFetch &&
      Boolean(dataSource) &&
      !currentState?.searchValue
    );
  }, [value, _canFetch, dataSource, currentState?.searchValue]);

  // 更新prevValueRef
  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  // 自动获取选项的副作用
  useEffect(() => {
    // ... 这里会有获取选项的逻辑
  }, [shouldFetchOptionsWithDefaultValue]);

  // 计算最终选项
  const finalOptions: Array<SelectOption> = useMemo(() => {
    if (
      isEmpty(enumOptionConfig) &&
      isEmpty(initialOptions) &&
      !_canFetch &&
      !currentState?.searchValue
    ) {
      return [];
    }
    if (initialOptions?.length > 0) {
      return handleOptions({
        options: initialOptions as SelectOption[],
        value,
      });
    }
    if (dataSource) {
      return handleOptions({
        options: currentState?.fetchOptions || [],
        value,
      });
    }
    return handleOptions({ options: enumOptions, value });
  }, [
    enumOptionConfig,
    initialOptions,
    _canFetch,
    dataSource,
    handleOptions,
    enumOptions,
    value,
    // 🔧 修复死循环：使用具体值而不是整个对象
    JSON.stringify(currentState?.fetchOptions),
    currentState?.searchValue,
    currentState?.stateVersion,
  ]);

  // 类型守护函数
  const isValidSelectValue = (
    val: unknown,
  ): val is string | number | boolean | string[] | number[] | boolean[] => {
    if (
      typeof val === 'string' ||
      typeof val === 'number' ||
      typeof val === 'boolean'
    ) {
      return true;
    }
    if (Array.isArray(val)) {
      return val.every(
        (item) =>
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean',
      );
    }
    return false;
  };

  // 🔧 类型兼容的值转换函数：根据options的实际类型进行智能转换
  const convertToSelectValue = (
    val: unknown,
  ):
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | undefined => {
    if (val === null || val === undefined) {
      return undefined;
    }

    if (isValidSelectValue(val)) {
      return val;
    }

    // 获取第一个option的value类型作为参考
    const firstOptionValueType =
      finalOptions?.length > 0 ? typeof finalOptions[0].value : 'string';

    // 如果不是有效值，尝试转换
    if (Array.isArray(val)) {
      const validItems = val.filter(
        (item) =>
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean',
      );

      if (validItems.length === 0) {
        return undefined;
      }

      // 🔧 根据options的类型决定转换方向，确保数组类型一致
      if (firstOptionValueType === 'number') {
        // 如果options的value是数字，将value转换为数字数组
        const converted = validItems.map((item) => {
          const numValue = Number(item);
          return Number.isNaN(numValue) ? 0 : numValue; // 转换失败时使用0作为默认值
        });
        return converted;
      }
      if (firstOptionValueType === 'boolean') {
        // 如果options的value是布尔值，将value转换为布尔值数组
        const converted = validItems.map((item) => Boolean(item));
        return converted;
      }
      // 如果options的value是字符串，将value转换为字符串数组
      const converted = validItems.map((item) => String(item));
      return converted;
    }

    // 对于其他类型，只有string、number和boolean才处理，对象类型返回undefined
    if (typeof val === 'string' || typeof val === 'number') {
      // 🔧 根据options的类型决定转换方向
      if (firstOptionValueType === 'number') {
        const numValue = Number(val);
        return Number.isNaN(numValue) ? String(val) : numValue;
      }
      return String(val);
    }

    // 🔧 boolean 类型直接返回，不进行转换
    if (typeof val === 'boolean') {
      return val;
    }

    // 对象类型不进行字符串化，返回undefined
    return undefined;
  };

  // 计算最终默认值
  const finalDefaultValue = useMemo(():
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | undefined => {
    if (defaultValue !== undefined) {
      return convertToSelectValue(defaultValue);
    }

    if (defaultActiveFirstOption) {
      const defaultActiveValue = finalOptions?.find(
        (option) => !option?.disabled,
      )?.value;

      if (mode === 'multiple') {
        // 🔧 根据options的类型返回同质数组
        if (defaultActiveValue !== undefined) {
          if (typeof defaultActiveValue === 'number') {
            return [defaultActiveValue] as number[];
          }
          if (typeof defaultActiveValue === 'boolean') {
            return [defaultActiveValue] as boolean[];
          }
          return [String(defaultActiveValue)] as string[];
        }
        return [];
      }
      return defaultActiveValue;
    }

    return undefined;
  }, [defaultValue, defaultActiveFirstOption, finalOptions, mode]);

  // 计算最终值
  const finalValue = useMemo(():
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | undefined => {
    const converted = convertToSelectValue(value);

    logger.info(
      'UseOptionsProcessing',
      '🔍 finalValue计算',
      {
        inputValue: value,
        inputValueType: typeof value,
        convertedValue: converted,
        convertedValueType: typeof converted,
        valueChanged: prevValueRef.current !== value,
        prevValue: prevValueRef.current,
        finalOptionsLength: finalOptions?.length || 0,
        placeholder: (props as any).placeholder,
        addBefore: (props as any).addBefore,
        timestamp: new Date().toISOString(),
      },
      'useMemo_finalValue',
    );

    return converted;
  }, [value, finalOptions]); // 🔧 添加finalOptions依赖，确保options类型变化时重新计算

  // 初始选项副作用
  useDeepCompareEffect(() => {
    if (!initialOptions) {
      return;
    }
    // 原始逻辑：通过context设置fetchOptions，但context是私有的
    // 使用类型断言和unknown中间类型来安全访问内部context
    if (dataFetcher && 'context' in dataFetcher) {
      const dataFetcherWithContext =
        dataFetcher as unknown as DataFetcherWithContext;
      if (dataFetcherWithContext.context) {
        dataFetcherWithContext.context.setState({
          fetchOptions: initialOptions as SelectOption[],
        });
      }
    }
  }, [initialOptions, dataFetcher]);

  // 选项变化回调
  useDeepCompareEffect(() => {
    onOptionsChange?.(finalOptions);
  }, [finalOptions, onOptionsChange]);

  return {
    finalOptions,
    finalDefaultValue,
    finalValue,
    shouldFetchOptionsWithDefaultValue,
    shouldFetchDueToValueEmpty,
    _canFetch,
    dataSource,
    dataSourceShare,
    isFirstHint,
    dependency,
  };
}
