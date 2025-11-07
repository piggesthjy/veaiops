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

import type { CascaderProps } from '@arco-design/web-react/es/Cascader/interface';
import type { SelectProps } from '@arco-design/web-react/es/Select/interface';
import { IconDown } from '@arco-design/web-react/icon';

// 这些常量已移动到 form-control/wrapper/constants.ts 中
// 避免重复导出，请从 form-control/wrapper 模块导入

export const commonSelectProps: Partial<SelectProps> = {
  className: 'w-default-control',
  showSearch: true,
  allowClear: true,
  arrowIcon: <IconDown />,
  placeholder: '请选择',
};

export const commonCascaderProps: Partial<CascaderProps> = {
  className: 'w-default-control',
  showSearch: true,
  allowClear: true,
  placeholder: '请选择',
};

export const commonInputProps = {
  className: 'w-default-control',
  placeholder: '请输入',
  autoComplete: 'off',
  allowClear: true,
  style: { width: '100%' },
};

export const commonInputNumberProps = {
  className: 'w-default-control',
  placeholder: '请输入',
};

export const smallInputProps = {
  ...commonInputProps,
  style: {
    width: 200, // SMALL_CONTROL_WIDTH 的值
  },
};

export const commonInputTextAreaProps = {
  className: 'w-default-control',
  wrapperStyle: {
    width: 'inherit',
  },
  placeholder: '请输入',
  allowClear: true,
};

export const commonDateRangePickerProps = {
  className: 'w-default-control',
  autoComplete: 'off',
};

/**
 * 表单项常量定义
 * @description 提供表单项相关的常量配置

 *
 */

/** 表单项类型枚举 */
export const FORM_ITEM_TYPES = {
  INPUT: 'input',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  DATE_PICKER: 'datePicker',
  TIME_PICKER: 'timePicker',
  CASCADER: 'cascader',
  UPLOAD: 'upload',
  SWITCH: 'switch',
} as const;

/** 表单项验证规则类型 */
export const VALIDATION_TYPES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  URL: 'url',
  PHONE: 'phone',
  NUMBER: 'number',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  PATTERN: 'pattern',
} as const;

/** 表单项尺寸 */
export const FORM_ITEM_SIZES = {
  MINI: 'mini',
  SMALL: 'small',
  DEFAULT: 'default',
  LARGE: 'large',
} as const;

/** 表单布局类型 */
export const FORM_LAYOUTS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  INLINE: 'inline',
} as const;

/** 表单项状态 */
export const FORM_ITEM_STATUS = {
  DEFAULT: 'default',
  ERROR: 'error',
  WARNING: 'warning',
  SUCCESS: 'success',
} as const;

// 类型导出
export type FormItemType =
  (typeof FORM_ITEM_TYPES)[keyof typeof FORM_ITEM_TYPES];
export type ValidationType =
  (typeof VALIDATION_TYPES)[keyof typeof VALIDATION_TYPES];
export type FormItemSize =
  (typeof FORM_ITEM_SIZES)[keyof typeof FORM_ITEM_SIZES];
export type FormLayout = (typeof FORM_LAYOUTS)[keyof typeof FORM_LAYOUTS];
export type FormItemStatus =
  (typeof FORM_ITEM_STATUS)[keyof typeof FORM_ITEM_STATUS];
