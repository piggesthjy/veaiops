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

import type { IntelligentThresholdTaskVersion } from 'api-generate';

/**
 * 带可选行跨度的类型
 */
export type WithOptionalRowSpan<T> = T & { rowSpan?: number };

/**
 * 扁平化的版本数据类型
 */
export type FlattenedVersion = WithOptionalRowSpan<
  IntelligentThresholdTaskVersion & {
    filter?: { key?: string; operator?: string; value?: unknown };
  }
>;

/**
 * 版本表格列配置所需的额外 Props
 * 注意：HandleColumnsProps 已在 @task-config/lib 中定义，这里只定义版本表格特有的类型
 */
export interface VersionColumnsProps {
  setDetailConfigData: (data: FlattenedVersion) => void;
  setDetailConfigVisible: (visible: boolean) => void;
  onCreateAlarm: (data: FlattenedVersion) => void;
  onViewCleaningResult?: (data: FlattenedVersion) => void;
  onRerunOpen: (data: FlattenedVersion) => void;
}
