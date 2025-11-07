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

export interface FormItemControlProps<T = any> {
  baseFormItemProps?: any;
  baseControlProps?: any;
  formItemProps?: any;
  isLeftAlign?: boolean;
  serviceInstance?: any;
  enableCreate?: boolean;
  disabledList?: Array<string | number>;
  controlProps?: T;
  isControl?: boolean;
  payload?: any;
  onChange?: (v: any, o?: any) => void;
  value?: any;
  model?: any;
  label?: any;
  wrapperWidth?: number;
  wrapperClassName?: string;
  required?: boolean;
  isUserId?: boolean;
  inline?: boolean;
}
