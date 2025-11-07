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

import { Popover } from '@arco-design/web-react';
import type { PopoverProps } from '@arco-design/web-react/es/Popover/interface';
import type { ReactNode } from 'react';

/**
 * 高阶组件，将 Popover 功能添加到组件中
 * @param {React.ComponentType} WrappedComponent - 要包裹的组件
 * @returns {React.ComponentType} - 包含 Popover 功能的新组件
 */
const WithPopover = (
  WrappedComponent: JSX.Element,
): (({ popoverProps }: { popoverProps: PopoverProps }) => ReactNode) => {
  /**
   * 包含 Popover 功能的组件
   * @param {PopoverProps} props.popoverProps - Popover 组件的属性
   * @returns {React.ReactNode} - 渲染的组件
   */
  return ({ popoverProps }: { popoverProps: PopoverProps }): ReactNode => {
    return <Popover {...popoverProps}>{WrappedComponent}</Popover>;
  };
};

export { WithPopover };
