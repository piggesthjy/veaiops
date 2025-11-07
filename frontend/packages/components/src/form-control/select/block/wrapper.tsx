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

import type { FC } from 'react';
import { FormItemWrapper } from '../../wrapper';
import type { FormItemControlProps } from '../../wrapper/types';
import { logger } from './logger';
import { SelectBlock } from './select-block';
import type { veArchSelectBlockProps } from './types/interface';

/**
 * 包装了 FormItemWrapper 的 SelectBlock 组件
 * 提供表单项包装功能，支持垂直布局等特性
 */
const WrappedSelectBlock: FC<FormItemControlProps<veArchSelectBlockProps>> = (
  props,
) => {
  const { controlProps, ...wrapperProps } = props;

  // 🔧 添加 wrapper 层日志 - 重点追踪 dependency
  logger.debug(
    'WrappedSelectBlock',
    '🔵 Props 接收 (Wrapper层)',
    {
      hasControlProps: Boolean(controlProps),
      controlPropsKeys: controlProps ? Object.keys(controlProps) : [],
      // 🎯 重点：dependency 追踪
      hasDependency: Boolean(controlProps?.dependency),
      dependency: controlProps?.dependency,
      dependencyString: JSON.stringify(controlProps?.dependency),
      dependencyType: typeof controlProps?.dependency,
      dependencyIsArray: Array.isArray(controlProps?.dependency),
      dependencyLength: Array.isArray(controlProps?.dependency)
        ? controlProps.dependency.length
        : 0,
      dependencyFirstItem: Array.isArray(controlProps?.dependency)
        ? controlProps.dependency[0]
        : undefined,
      // dataSource 信息
      hasDataSource: Boolean(controlProps?.dataSource),
      dataSourceType: typeof controlProps?.dataSource,
      dataSourceKeys:
        controlProps?.dataSource && typeof controlProps?.dataSource === 'object'
          ? Object.keys(controlProps.dataSource)
          : [],
      dataSourceApi:
        controlProps?.dataSource && typeof controlProps?.dataSource === 'object'
          ? (controlProps.dataSource as any).api
          : undefined,
      // 其他关键 props
      placeholder: controlProps?.placeholder,
      disabled: controlProps?.disabled,
      canFetch: controlProps?.canFetch,
      id: controlProps?.id,
    },
    'WrappedSelectBlock',
  );

  return (
    <FormItemWrapper {...wrapperProps}>
      <SelectBlock
        triggerProps={{
          style: {
            zIndex: 1200,
          },
        }}
        {...controlProps}
      />
    </FormItemWrapper>
  );
};

export { WrappedSelectBlock };
