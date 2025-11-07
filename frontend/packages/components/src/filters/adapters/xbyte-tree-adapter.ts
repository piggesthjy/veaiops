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

export function adaptOnChange(onChange?: any) {
  return (v: number | number[], option: any) => {
    if (typeof onChange === 'function') {
      onChange(v, option);
    }
  };
}

export function adaptRenderFormat(renderFormat?: any) {
  if (typeof renderFormat === 'function') {
    return (option: any, value: any) => renderFormat(option, value);
  }
  return renderFormat;
}

export function adaptTriggerElement(triggerElement?: any) {
  if (typeof triggerElement === 'function') {
    return (params: { value: any }) => triggerElement({ value: params.value });
  }
  return triggerElement;
}

export function adaptOnSearch(onSearch?: any) {
  if (typeof onSearch === 'function') {
    return (inputValue: string) => onSearch(inputValue);
  }
  return onSearch;
}

export function adaptNumberValue(val: any) {
  if (Array.isArray(val)) {
    return val.map(Number);
  }
  if (val !== undefined) {
    return Number(val);
  }
  return undefined;
}
