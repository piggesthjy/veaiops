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

import { omit } from 'lodash-es';
import type { FilterPluginContext } from '../plugins';
import { commonClassName, fixFilterControlCls } from './constants';
import type { FieldItem, FilterStyle } from './types';

/**
 * 劫持组件属性，添加固定的CSS类名
 * @param componentProps 原始组件属性
 * @returns 劫持后的组件属性
 */
export const hijackComponentProps = (
  componentProps?: Record<string, unknown>,
): Record<string, unknown> => {
  // 处理空的 componentProps
  if (!componentProps || typeof componentProps !== 'object') {
    return { ...fixFilterControlCls };
  }

  // 过滤掉不应该传递到 DOM 元素的属性
  const { subType, ...filteredProps } = componentProps;
  return { ...filteredProps, ...fixFilterControlCls };
};

/**
 * 劫持控制组件属性，将样式类名添加到controlProps中
 * @param componentProps 原始组件属性
 * @returns 劫持后的组件属性
 */
export const hijackControlComponentProps = (
  componentProps?: Record<string, unknown>,
): Record<string, unknown> => {
  // 处理空的 componentProps
  if (!componentProps || typeof componentProps !== 'object') {
    return {
      controlProps: fixFilterControlCls,
    };
  }

  // 将应该放在 controlProps 中的属性提取出来
  const controlPropsKeys = [
    'addBefore',
    'maxTagCount',
    'mode',
    'dataSource',
    'renderFormat',
    'isDebouncedFetch',
    'isScrollFetching',
    'isCascadeRemoteSearch',
    'isValueEmptyTriggerOptions',
    'searchKey',
    'onChange',
    'value',
    'enumOptionConfig',
    'placeholder',
    'allowClear',
    'options',
    'showSearch',
    'fieldNames',
    'allowPasteMultiple',
  ];

  const controlPropsFromTop = Object.keys(componentProps)
    .filter((key) => controlPropsKeys.includes(key))
    .reduce(
      (obj, key) => {
        obj[key] = componentProps[key];
        return obj;
      },
      {} as Record<string, unknown>,
    );

  return {
    controlProps: {
      ...(componentProps?.controlProps || {}),
      ...controlPropsFromTop,
      ...fixFilterControlCls,
    },
    ...omit(componentProps, [
      ...controlPropsKeys,
      'controlProps',
      'isControl',
      'formItemProps',
      'subType', // 过滤掉 subType，防止传递到 DOM 元素
    ]),
  };
};

/**
 * 创建插件上下文
 * @param form 表单实例
 * @param finalStyle 最终样式配置
 * @param eventBus 事件总线
 * @returns 插件上下文
 */
export const createPluginContext = (
  form: unknown,
  finalStyle: FilterStyle,
  eventBus: unknown,
): FilterPluginContext => ({
  form: form as FilterPluginContext['form'],
  globalConfig: {
    filterStyle: finalStyle,
    commonClassName,
  },
  eventBus: eventBus as FilterPluginContext['eventBus'],
});

/**
 * 检查字段是否可见
 * @param field 字段配置
 * @returns 是否可见
 */
export const isFieldVisible = (field: FieldItem): boolean => {
  return field.visible === undefined || field.visible;
};

/**
 * 合并筛选器样式
 * @param defaultStyle 默认样式
 * @param customStyle 自定义样式
 * @returns 合并后的样式
 */
export const mergeFilterStyle = (
  defaultStyle: FilterStyle,
  customStyle?: Partial<FilterStyle>,
): FilterStyle => {
  if (!customStyle) {
    return defaultStyle;
  }

  return {
    ...defaultStyle,
    ...customStyle,
    style: {
      ...defaultStyle.style,
      ...customStyle.style,
    },
  };
};

/**
 * 生成CSS类名字符串
 * @param baseClassName 基础类名
 * @param additionalClasses 额外类名数组
 * @returns 完整的类名字符串
 */
export const generateClassName = (
  baseClassName: string,
  ...additionalClasses: (string | undefined)[]
): string => {
  return [baseClassName, ...additionalClasses.filter(Boolean)].join(' ').trim();
};

/**
 * 验证字段配置
 * @param field 字段配置
 * @returns 验证结果
 */
export const validateFieldConfig = (
  field: FieldItem,
): {
  isValid: boolean;
  error?: string;
} => {
  if (!field.type) {
    return {
      isValid: false,
      error: '字段类型不能为空',
    };
  }

  if (!field.componentProps || typeof field.componentProps !== 'object') {
    return {
      isValid: false,
      error: '组件属性配置无效',
    };
  }

  return { isValid: true };
};

/**
 * 生成字段的唯一键
 * @param field 字段配置
 * @param index 索引
 * @returns 唯一键
 */
/**
 * generateFieldKey 参数接口
 */
export interface GenerateFieldKeyParams {
  field: FieldItem;
  index: number;
}

export const generateFieldKey = ({
  field,
  index,
}: GenerateFieldKeyParams): string => {
  return field.field || `field-${index}`;
};

/**
 * Label 转换配置类型
 */
export type LabelAsType = 'addBefore' | 'addAfter' | 'prefix' | 'suffix';

/**
 * 组件类型到默认 label 属性的映射
 * 不同的 Arco Design 组件支持不同的前缀/后缀属性
 */
const COMPONENT_LABEL_MAPPING: Record<string, LabelAsType> = {
  // Select 系列组件：使用 addBefore（显示在选择框左侧）
  Select: 'addBefore',
  Cascader: 'addBefore',
  TreeSelect: 'addBefore',

  // Input 系列组件：使用 addBefore（显示在输入框左侧）
  Input: 'addBefore',
  InputNumber: 'addBefore',
  InputTag: 'addBefore',

  // 日期时间组件：使用 addBefore
  DatePicker: 'addBefore',
  RangePicker: 'addBefore',
  TimePicker: 'addBefore',

  // 其他组件：默认使用 addBefore
};

/**
 * 处理 label 字段，将其转换为 componentProps 中的 addBefore/prefix 等属性
 *
 * 功能说明：
 * 1. 支持在 label 字段中传递字符串，自动转换为对应组件的属性（addBefore/prefix/suffix/addAfter）
 * 2. 支持在 componentProps 中直接传递 addBefore/prefix 等属性（优先级更高）
 * 3. 支持通过 labelAs 参数自定义转换目标属性
 *
 * 优先级：
 * componentProps.addBefore/prefix > labelAs 配置 > 组件类型默认映射 > label 字符串
 *
 * @param field 字段配置
 * @returns 处理后的 componentProps
 *
 * @example
 * // 场景 1: label 自动转换为 addBefore（Select 组件）
 * {
 *   field: 'agent_type',
 *   label: '智能体',
 *   type: 'Select',
 *   componentProps: { options: [...] }
 * }
 * // => componentProps: { addBefore: '智能体', options: [...] }
 *
 * @example
 * // 场景 2: label 自动转换为 addBefore（Input 组件）
 * {
 *   field: 'name',
 *   label: '名称',
 *   type: 'Input',
 *   componentProps: { placeholder: '请输入' }
 * }
 * // => componentProps: { addBefore: '名称', placeholder: '请输入' }
 *
 * @example
 * // 场景 3: componentProps 优先级更高
 * {
 *   field: 'name',
 *   label: '名称',
 *   type: 'Select',
 *   componentProps: { addBefore: '自定义前缀', options: [...] }
 * }
 * // => componentProps: { addBefore: '自定义前缀', options: [...] }
 *
 * @example
 * // 场景 4: 使用 labelAs 自定义转换属性
 * {
 *   field: 'name',
 *   label: '名称',
 *   type: 'Select',
 *   labelAs: 'suffix',
 *   componentProps: { options: [...] }
 * }
 * // => componentProps: { suffix: '名称', options: [...] }
 */
export const processLabelAsComponentProp = (
  field: FieldItem,
): Record<string, unknown> => {
  const { label, type, componentProps = {}, labelAs } = field;

  // 如果没有 label 或 label 不是字符串，直接返回原 componentProps
  if (!label || typeof label !== 'string') {
    return componentProps;
  }

  // 解析组件类型（处理命名空间类型，如 Select.Account）
  const [mainType] = (type || '').split('.');

  // 确定目标属性名
  let targetProp: LabelAsType;

  if (labelAs) {
    // 优先使用显式指定的 labelAs 配置
    targetProp = labelAs as LabelAsType;
  } else {
    // 使用组件类型默认映射，如果没有映射则使用 addBefore
    targetProp = COMPONENT_LABEL_MAPPING[mainType] || 'addBefore';
  }

  // 检查 componentProps 中是否已经存在任何 label 相关属性
  const hasLabelProp =
    componentProps.addBefore !== undefined ||
    componentProps.addAfter !== undefined ||
    componentProps.prefix !== undefined ||
    componentProps.suffix !== undefined;

  // 如果 componentProps 中已经有 label 相关属性，优先使用 componentProps
  if (hasLabelProp) {
    return componentProps;
  }

  // 将 label 转换为目标属性
  return {
    ...componentProps,
    [targetProp]: label,
  };
};
