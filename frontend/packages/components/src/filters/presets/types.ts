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

/**
 * 预设配置类型定义
 */
import type { FieldItem } from '../core/types';

/**
 * 预设配置生成器
 */
export type PresetGenerator = (
  params?: Record<string, unknown>,
) => Omit<FieldItem, 'preset'>;

/**
 * 预设配置映射
 */
export interface PresetRegistry {
  [presetName: string]: PresetGenerator;
}

/**
 * 预设配置参数
 */
export interface PresetParams {
  /** 字段名称 */
  field?: string;
  /** 标签文本 */
  label?: string;
  /** 占位符 */
  placeholder?: string;
  /** 是否必填 */
  required?: boolean;
  /** 最大标签数量 */
  maxTagCount?: number;
  /** 选择模式 */
  mode?: 'single' | 'multiple';
  /** 自定义属性 */
  [key: string]: unknown;
}
