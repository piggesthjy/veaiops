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

import { filterPresetRegistry } from '../presets';
/**
 * 预设处理器
 * 处理带有预设配置的字段项
 */
import type { FieldItem } from './types';

/**
 * 处理预设配置
 * @param field 字段配置
 * @returns 处理后的字段配置
 */
export const processPreset = (field: FieldItem): FieldItem => {
  // 如果没有预设配置，直接返回
  if (!field.preset) {
    return field;
  }

  // 获取预设生成器
  const presetGenerator = filterPresetRegistry.get(field.preset);
  if (!presetGenerator) {
    return field;
  }

  // 生成预设配置
  const presetConfig = presetGenerator(field.componentProps);

  // 合并配置，用户配置优先
  const mergedField: FieldItem = {
    ...presetConfig,
    ...field,
    // 深度合并 componentProps
    componentProps: {
      ...presetConfig.componentProps,
      ...field.componentProps,
    },
  };

  // 移除 preset 属性，避免重复处理
  delete mergedField.preset;

  return mergedField;
};

/**
 * 批量处理预设配置
 * @param fields 字段配置列表
 * @returns 处理后的字段配置列表
 */
export const processPresets = (fields: FieldItem[]): FieldItem[] => {
  return fields.map(processPreset);
};
