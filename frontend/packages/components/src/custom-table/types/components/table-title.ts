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
 * TableTitle 组件类型定义
 *

 * @date 2025-12-19
 */

import type { CSSProperties, ReactNode } from 'react';

/**
 * @name TableTitle 组件属性接口
 * @description 表格标题组件的属性定义
 */
export interface TableTitleProps {
  /** @name 表格标题文本 */
  title?: ReactNode;
  /** @name 标题右侧操作按钮组 */
  actions?: ReactNode[];
  /** @name 容器样式类名 */
  className?: string;
  /** @name 标题容器内联样式 */
  titleStyle?: CSSProperties;
  /** @name 操作按钮样式类名 */
  actionClassName?: string;
}
