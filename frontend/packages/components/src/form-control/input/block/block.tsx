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

import { commonInputProps } from '@/constants';
import type { FormItemControlProps } from '@/form-control';
import { FormItemWrapper } from '@/form-control';
import { Input } from '@arco-design/web-react';
import type { InputProps } from '@arco-design/web-react/es/Input/interface';
import { type FC, useEffect, useState } from 'react';

/**
 * InputBlock 组件包装器
 * 提供表单项包装功能，支持垂直布局等特性
 */
const InputBlock: FC<FormItemControlProps<InputProps>> = (props) => {
  const { controlProps, ...wrapperProps } = props;
  const [inputType, setInputType] = useState<string>('text');

  // 根据输入类型设置不同的autocomplete值和初始type
  const getAutoCompleteValue = () => {
    if (controlProps?.type === 'password') {
      return 'new-password';
    }
    return 'off';
  };

  // 处理密码字段的动态type切换
  useEffect(() => {
    if (controlProps?.type === 'password') {
      // 初始设置为text类型，防止浏览器识别为密码字段
      setInputType('text');
    } else {
      setInputType(controlProps?.type || 'text');
    }
  }, [controlProps?.type]);

  const handleFocus = () => {
    if (controlProps?.type === 'password' && inputType === 'text') {
      // 聚焦时切换为password类型
      setInputType('password');
    }
  };

  const handleBlur = () => {
    if (controlProps?.type === 'password' && inputType === 'password') {
      // 失焦时切换回text类型，防止浏览器保存密码
      setInputType('text');
    }
  };

  return (
    <FormItemWrapper {...wrapperProps}>
      <Input
        {...commonInputProps}
        {...controlProps}
        type={inputType}
        autoComplete={getAutoCompleteValue()}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </FormItemWrapper>
  );
};

export { InputBlock };
