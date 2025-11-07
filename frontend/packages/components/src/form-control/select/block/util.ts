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

import { safeJSONParse } from '@veaiops/utils';
import {
  camelCase,
  isEmpty,
  isNull,
  isObject,
  isUndefined,
  isNaN as lodashIsNaN,
  mapValues,
  omitBy,
} from 'lodash-es';
import type { ReactElement } from 'react';
import { sessionStore } from './cache-store';
import { logger } from './logger';
import type {
  DataSourceSetter,
  EnumOptionConfigs,
  Option,
  OptionfyProps,
  OptionsEntity,
  StandardEnum,
} from './types/interface';

/**
 * 默认下拉框过滤
 * @param inputValue
 * @param option
 */
export const defaultFilterOption = (
  inputValue: string,
  option: ReactElement,
) => {
  const lowerCaseValue = inputValue?.toLowerCase();
  return (
    option?.props?.children
      ?.toString()
      ?.toLowerCase()
      ?.includes(lowerCaseValue) ||
    option?.props?.value?.toString()?.toLowerCase()?.includes(lowerCaseValue)
  );
};

/**
 * 确保输入值是一个数组。
 * 如果值是undefined，返回一个空数组。
 * 如果值不是数组，返回一个包含该值的数组。
 * 如果值已经是一个数组，直接返回该值。
 *
 * @param value - 需要确保为数组的输入值。
 * @returns 代表输入值的一个数组。
 */
export const ensureArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value as T];
};

export const getFrontEnumsByKey = ({
  enumCacheKey,
  key,
}: {
  key: string;
  enumCacheKey: string;
}): Array<StandardEnum> => {
  if (!key) {
    return [];
  }
  // 从 sessionStorage 中获取前端枚举数据
  const frontEnums = sessionStore.get(enumCacheKey, {});
  if (!frontEnums) {
    return [];
  }
  // 根据键获取枚举数据源
  return ensureArray<StandardEnum>(frontEnums?.[key]);
};

// 根据过滤条件对象对数组进行条件过滤，并返回过滤后的数组
export const filterArrayByObjectCriteria = <T>({
  data, // 待过滤的数组
  filterCriteria, // 过滤条件对象
}: {
  data: T[];
  filterCriteria: Partial<T>;
}): T[] => {
  // 遍历待过滤的数组，根据过滤条件进行匹配
  const filteredArray = data.filter((item) => {
    // 判断当前数组元素与过滤条件是否匹配
    for (const key in filterCriteria) {
      if (item[key] !== filterCriteria[key]) {
        return false; // 如果有任何一个条件不匹配，则返回 false，不包含在过滤后的数组中
      }
    }
    return true; // 当所有条件匹配时，返回 true，包含在过滤后的数组中
  });

  return filteredArray; // 返回过滤后的数组
};

export const optionfy = <T>({
  dataSet,
  labelKey,
  valueKey,
  countKey,
  countKeyUnit,
  isStringItem = false,
  isJoin = false,
  valueRender,
  labelRender = ({ _label }: { record: T; _label: any }) => _label,
  disabledList = [],
  disabledCheckFunc = (_: any) => false,
  filters = {},
}: OptionfyProps<T>): Array<Option<T>> => {
  if (!dataSet || !Array.isArray(dataSet)) {
    return [];
  }
  if (isStringItem) {
    return dataSet.map((item) => ({
      label: item,
      value: item,
    })) as Array<Option<T>>;
  }
  const _renderLabel = ({ record }: { record: T }) => {
    if (isJoin) {
      return `${record?.[labelKey as keyof T]}（${record?.[valueKey as keyof T]}）`;
    }
    if (countKey) {
      return `${record?.[labelKey as keyof T]}（存量${
        record?.[countKey as keyof T]
      }${countKeyUnit}）`;
    }
    return labelRender?.({ record, _label: record?.[labelKey as keyof T] });
  };

  let _dataSet = dataSet;

  if (!isEmpty(filters)) {
    _dataSet = filterArrayByObjectCriteria({
      data: dataSet,
      filterCriteria: filters,
    });
  }

  return _dataSet
    .map((item) => {
      const _value = item?.[valueKey as keyof T];
      const renderedValue = valueRender
        ? valueRender({ record: item, value: _value })
        : _value;
      return {
        label: _renderLabel({ record: item }),
        value: renderedValue,
        extra: item,
        disabled:
          disabledList.includes(renderedValue) ||
          disabledCheckFunc?.(renderedValue),
      };
    })
    .filter(
      (item) =>
        item.value !== undefined &&
        item.value !== null &&
        item.label !== undefined &&
        item.label !== null,
    );
};

/**
 * 判断一个字符串是否可以被转换成数字
 * @param str 需要被检查的字符串
 * @return 如果字符串可以被转换成数字则返回true，否则返回false
 */
export const canConvertToNumber = (str: string | number | unknown): boolean => {
  if (!str) {
    return false;
  }
  const num = Number(str);
  return !lodashIsNaN(num);
};

/**
 * 转换枚举数据为选项对象数组
 * @param enumData
 * @param isValueToNumber
 * @param isValueToBoolean
 */
const convertToOptionObject = (
  enumData: StandardEnum,
  isValueToNumber: boolean,
  isValueToBoolean: boolean,
) => {
  const { code, name, label, value, extend } = enumData;

  let parsedCode: any = code || value;
  if (isValueToBoolean) {
    parsedCode = (code || value) === 'true';
  } else if (
    isValueToNumber &&
    !isValueToBoolean &&
    canConvertToNumber(parsedCode)
  ) {
    parsedCode = Number(parsedCode);
  }

  return {
    code: parsedCode,
    name: name || label,
    extend: safeJSONParse({ valueString: extend, empty: {} }) as any,
  };
};

/**
 * 获取前端枚举的选项列表
 * @param enumCacheKey 枚举缓存键
 * @param key 枚举的键
 * @param filterCode 过滤的代码（可选）
 * @param isStringItem
 * @param labelRender
 * @param disabledList
 * @param isValueToNumber
 * @param isValueToBoolean
 * @returns 选项列表对象，包含选项数组
 */
export const getFrontEnumsOptions = ({
  enumCacheKey,
  key,
  filterCode,
  isStringItem = false,
  labelRender,
  disabledList = [],
  isValueToNumber = false,
  isValueToBoolean = false,
}: EnumOptionConfigs): OptionsEntity => {
  // 如果枚举键为空，则返回空的选项列表对象
  if (!key) {
    return {
      options: [],
    };
  }

  // 从 sessionStorage 中获取前端枚举数据
  const enumDataSource = getFrontEnumsByKey({
    enumCacheKey: enumCacheKey || 'front_enums',
    key: camelCase(key),
  });

  // 如果无法获取前端枚举数据或指定键的枚举数据不存在，则返回空的选项列表对象
  if (isEmpty(enumDataSource)) {
    return {
      options: [],
    };
  }

  // 将枚举数据转换为选项对象数组
  let _dataSet = enumDataSource.map((config: StandardEnum) =>
    convertToOptionObject(config, isValueToNumber, isValueToBoolean),
  );

  // 如果指定了过滤代码，则根据过滤条件对枚举数据进行筛选
  if (filterCode) {
    _dataSet = _dataSet.filter((config) => config?.extend?.code === filterCode);
  }

  const _disabledList = disabledList;
  if (_dataSet) {
    // 合并配置里面的disabled
    _disabledList.push(
      ..._dataSet
        .filter((item) => item.extend?.disabled)
        .map((item) => item?.code),
    );
  }

  // 调用 optionfy 函数将选项对象数组转换为标准选项数组
  const options = optionfy({
    dataSet: _dataSet,
    labelKey: 'name',
    valueKey: 'code',
    labelRender,
    isStringItem,
    disabledList,
  });

  // 返回选项列表对象
  return { options };
};

/**
 * 类型守卫函数，用于检查提供的 dataSource 是否属于 DataSourceSetter 类型。
 * @param dataSource 要检查的数据源。
 * @returns 一个布尔值，指示 dataSource 是否属于 DataSourceSetter 类型。
 */
export const isDataSourceSetter: (
  dataSource: any,
) => dataSource is DataSourceSetter = (
  dataSource: any,
): dataSource is DataSourceSetter => {
  // 基础类型检查
  if (
    typeof dataSource !== 'object' ||
    !dataSource ||
    !('serviceInstance' in dataSource) ||
    !('api' in dataSource) ||
    !('responseEntityKey' in dataSource) ||
    !('optionCfg' in dataSource)
  ) {
    logger.debug(
      'Util',
      'isDataSourceSetter - 基础检查失败',
      {
        typeofDataSource: typeof dataSource,
        isNull: dataSource === null,
        hasServiceInstance: dataSource
          ? 'serviceInstance' in dataSource
          : false,
        hasApi: dataSource ? 'api' in dataSource : false,
        hasResponseEntityKey: dataSource
          ? 'responseEntityKey' in dataSource
          : false,
        hasOptionCfg: dataSource ? 'optionCfg' in dataSource : false,
      },
      'isDataSourceSetter',
    );
    return false;
  }

  // 🔧 增强验证：检查关键属性的值是否有效
  const { serviceInstance, api, responseEntityKey, optionCfg } = dataSource;

  // serviceInstance 必须是一个对象
  if (!serviceInstance || typeof serviceInstance !== 'object') {
    logger.warn(
      'Util',
      'isDataSourceSetter - serviceInstance 无效',
      {
        hasServiceInstance: Boolean(serviceInstance),
        serviceInstanceType: typeof serviceInstance,
      },
      'isDataSourceSetter',
    );
    return false;
  }

  // api 必须是一个非空字符串，并且不能包含 undefined/null 字符串
  if (
    !api ||
    typeof api !== 'string' ||
    api.trim() === '' ||
    api.includes('undefined') ||
    api.includes('null')
  ) {
    logger.warn(
      'Util',
      'isDataSourceSetter - api 无效',
      {
        api,
        apiType: typeof api,
        apiTrimmed: typeof api === 'string' ? api.trim() : null,
        includesUndefined: typeof api === 'string' && api.includes('undefined'),
        includesNull: typeof api === 'string' && api.includes('null'),
      },
      'isDataSourceSetter',
    );
    return false;
  }

  // api 方法必须存在于 serviceInstance 中
  if (typeof serviceInstance[api] !== 'function') {
    logger.warn(
      'Util',
      'isDataSourceSetter - api 方法不存在',
      {
        api,
        apiMethodType: typeof serviceInstance[api],
        serviceInstanceKeys: Object.keys(serviceInstance).slice(0, 10),
      },
      'isDataSourceSetter',
    );
    return false;
  }

  // responseEntityKey 必须是非空字符串
  if (
    !responseEntityKey ||
    typeof responseEntityKey !== 'string' ||
    responseEntityKey.trim() === ''
  ) {
    logger.warn(
      'Util',
      'isDataSourceSetter - responseEntityKey 无效',
      {
        responseEntityKey,
        responseEntityKeyType: typeof responseEntityKey,
      },
      'isDataSourceSetter',
    );
    return false;
  }

  // optionCfg 必须是对象
  if (!optionCfg || typeof optionCfg !== 'object') {
    logger.warn(
      'Util',
      'isDataSourceSetter - optionCfg 无效',
      {
        hasOptionCfg: Boolean(optionCfg),
        optionCfgType: typeof optionCfg,
      },
      'isDataSourceSetter',
    );
    return false;
  }

  logger.debug(
    'Util',
    'isDataSourceSetter - 验证通过',
    {
      api,
      responseEntityKey,
      optionCfgKeys: Object.keys(optionCfg),
    },
    'isDataSourceSetter',
  );

  return true;
};

/**
 * 移除对象中的 undefined 值
 * @param target 目标对象
 * @returns 移除 undefined 值后的新对象
 */
export const removeUndefinedValues = (target: any): any => {
  // 判断是否为对象
  if (!isObject(target)) {
    return target;
  }

  // 移除 undefined 值并生成新对象
  const filteredObj = omitBy(target, isUndefined);

  // 递归移除嵌套对象中的 undefined 值

  return mapValues(filteredObj, (value) => {
    if (Array.isArray(value)) {
      // 过滤数组中的 undefined 值
      return value.filter(
        (item) => !isUndefined(item) && !isNull(item) && !lodashIsNaN(item),
      );
    }
    // 递归调用移除Undefined值的函数
    return removeUndefinedValues(value);
  });
};

/**
 * 根据分隔符切分粘贴的文本内容
 * @param text 粘贴的原始文本
 * @param separators 分隔符数组，默认包含换行符、逗号、分号、制表符
 * @returns 切分后的字符串数组
 */
export const splitPastedText = (
  text: string,
  separators: string[] = ['\n', ',', ';', '\t'],
): string[] => {
  if (!text || !text.trim()) {
    return [];
  }

  // 构建正则表达式，处理特殊字符的转义
  const escapedSeparators = separators.map((sep) => {
    switch (sep) {
      case '\n':
        return '\\n';
      case '\t':
        return '\\t';
      case '\r':
        return '\\r';
      default:
        // 转义正则表达式特殊字符
        return sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  });

  // 创建正则表达式来匹配任意分隔符
  const separatorRegex = new RegExp(`[${escapedSeparators.join('')}]+`, 'g');

  // 切分文本并处理
  return text
    .split(separatorRegex)
    .map((val) => val.trim())
    .filter((val) => val.length > 0);
};
