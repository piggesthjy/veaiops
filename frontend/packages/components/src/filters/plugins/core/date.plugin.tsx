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

import { commonDateRangePickerProps } from '@/constants';
import type { FilterPlugin } from '@veaiops/types';
import {
  TimezoneAwareDatePicker as DatePicker,
  TimezoneAwareRangePicker as RangePicker,
} from '../../../timezone-aware';

// DatePicker plugin
export const DatePickerPlugin: FilterPlugin = {
  type: 'DatePicker',
  name: '日期选择器',
  description: '单日期选择组件',
  version: '1.0.0',
  render: ({ hijackedProps }: { hijackedProps?: Record<string, unknown> }) => {
    // Filter out properties that should not be passed to DOM elements, including addBefore
    const { subType, addBefore, ...filteredProps } = hijackedProps || {};

    // If there is an addBefore property, convert it to prefix
    const finalProps = addBefore
      ? { ...filteredProps, prefix: addBefore }
      : filteredProps;

    return <DatePicker {...commonDateRangePickerProps} {...finalProps} />;
  },
  validateConfig: (config: Record<string, unknown>) =>
    typeof config === 'object',
  defaultConfig: {
    placeholder: '请选择日期...',
    allowClear: true,
  },
};

// RangePicker plugin
export const RangePickerPlugin: FilterPlugin = {
  type: 'RangePicker',
  name: '日期范围选择器',
  description: '日期范围选择组件',
  version: '1.0.0',
  render: ({ hijackedProps }: { hijackedProps?: Record<string, unknown> }) => {
    // Filter out properties that should not be passed to DOM elements, including addBefore
    const { subType, addBefore, ...filteredProps } = hijackedProps || {};

    // If there is an addBefore property, convert it to prefix
    const finalProps = addBefore
      ? { ...filteredProps, prefix: addBefore }
      : filteredProps;

    return <RangePicker {...commonDateRangePickerProps} {...finalProps} />;
  },
  validateConfig: (config: Record<string, unknown>) =>
    typeof config === 'object',
  defaultConfig: {
    placeholder: ['开始日期', '结束日期'],
    allowClear: true,
  },
};

// DateRangePicker plugin (compatible with old configuration, equivalent to RangePicker)
export const DateRangePickerPlugin: FilterPlugin = {
  type: 'DateRangePicker',
  name: '日期范围选择器(兼容)',
  description: '与 RangePicker 等价，用于兼容旧的配置项',
  version: '1.0.0',
  render: ({ hijackedProps }: { hijackedProps?: Record<string, unknown> }) => {
    // Filter out properties that should not be passed to DOM elements, including addBefore
    const { subType, addBefore, ...filteredProps } = hijackedProps || {};

    // If there is an addBefore property, convert it to prefix
    const finalProps = addBefore
      ? { ...filteredProps, prefix: addBefore }
      : filteredProps;

    return <RangePicker {...commonDateRangePickerProps} {...finalProps} />;
  },
  validateConfig: (config: Record<string, unknown>) =>
    typeof config === 'object',
  defaultConfig: {
    placeholder: ['开始日期', '结束日期'],
    allowClear: true,
  },
};
