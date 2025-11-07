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

import { Form } from '@arco-design/web-react';
import { omit } from 'lodash-es';
import {
  type PropsWithChildren,
  type ReactElement,
  cloneElement,
  isValidElement,
} from 'react';

import { initAlign } from './constants';
import type { FormItemControlProps } from './types';
import { getControlProps } from './utils';

export const FormItemWrapper = <T,>(
  props: PropsWithChildren<FormItemControlProps<T>>,
): ReactElement => {
  const {
    isControl = false,
    inline = false,
    baseFormItemProps = {},
    formItemProps = {},
    isLeftAlign = false,
    required,
    children,
  } = props;

  // require
  const rules = required
    ? [
        {
          required,
          message: `${
            formItemProps?.label ||
            formItemProps?.formItemProps?.label ||
            baseFormItemProps?.label ||
            baseFormItemProps?.requiredLabel
          }必填`,
        },
      ]
    : [];

  // 获取controlProps
  const controlProps = getControlProps(props);
  const style = {};

  // form-item模式
  if (isControl) {
    const _children = (isValidElement(children)
      ? cloneElement(
          children,
          inline
            ? {
                style: { width: 320, ...(controlProps.style || {}) },
                ...omit(controlProps, 'style'),
              }
            : controlProps,
        )
      : children) as unknown as ReactElement;

    return (
      <Form.Item
        {...initAlign({
          isLeftAlign,
          labelCol: inline ? { span: 24 } : props?.formItemProps?.labelCol,
        })}
        rules={rules}
        layout={inline ? 'vertical' : props?.formItemProps?.layout}
        {...baseFormItemProps}
        {...formItemProps}
      >
        {_children}
      </Form.Item>
    );
  }

  const componentsProps: any = omit(props, ['controlProps', 'children']);
  if (formItemProps?.label) {
    componentsProps.addBefore = formItemProps?.addBefore;
  }
  if (controlProps?.addBefore) {
    componentsProps.addBefore = controlProps?.addBefore;
  }

  // 使用 Object.assign 合并 controlProps 和 componentsProps 中的 style 属性，如果属性不存在则不会合并
  Object.assign(
    style,
    inline ? { width: 250, ...(controlProps.style || {}) } : controlProps.style,
    inline
      ? { width: 250, ...(componentsProps.style || {}) }
      : componentsProps.style,
  );

  // 非form-item模式
  return isValidElement(children) ? (
    cloneElement(children, { ...controlProps, ...componentsProps, style })
  ) : (
    <>{children}</>
  );
};
