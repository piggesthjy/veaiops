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

import type { FormItemProps } from '@arco-design/web-react/es/Form/interface';

export const DEFAULT_CONTROL_WIDTH = 370;
export const SMALL_CONTROL_WIDTH = 200;
export const DEFAULT_ALIGN_LEFT_WIDTH = 134;

export const alignFormItemProps: FormItemProps = {
  labelAlign: 'right',
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

export const alignLeftFormItemProps: FormItemProps = {
  labelAlign: 'left',
  labelCol: {
    flex: 'none',
    style: {
      width: DEFAULT_ALIGN_LEFT_WIDTH,
    },
  },
};

export const initAlign = ({
  isLeftAlign,
  labelCol,
}: {
  isLeftAlign: boolean;
  labelCol?: FormItemProps;
}) =>
  isLeftAlign
    ? labelCol || alignLeftFormItemProps
    : labelCol || alignFormItemProps;
