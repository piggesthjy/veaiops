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

import { type FormItemControlProps, FormItemWrapper } from '@/form-control';
import { InputNumber } from '@arco-design/web-react';
import type { InputNumberProps } from '@arco-design/web-react/es/InputNumber/interface';
import type { FC } from 'react';

const commonInputNumberProps = {
  placeholder: '请输入',
  style: { width: '100%' },
};

/**
 * InputNumber 组件包装器
 * 提供表单项包装功能，支持垂直布局等特性
 */
const InputNumberComponent: FC<FormItemControlProps<InputNumberProps>> = (
  props,
) => {
  const { controlProps, ...wrapperProps } = props;

  return (
    <FormItemWrapper {...wrapperProps}>
      <InputNumber {...commonInputNumberProps} {...controlProps} />
    </FormItemWrapper>
  );
};

export { InputNumberComponent };
