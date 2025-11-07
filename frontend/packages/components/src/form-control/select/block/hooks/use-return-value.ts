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

import { useMemo } from 'react';
import type { SelectOption } from '../types/interface';
import type { SelectBlockState } from '../types/plugin';
import { defaultFilterOption } from '../util';

/**
 * 返回值构造Hook
 * 负责构造useSelectBlock的最终返回值
 */
export function useReturnValue({
  currentState,
  finalOptions,
  finalDefaultValue,
  finalValue,
  onSearch,
  handlePaste,
  handleVisibleChange,
  handleClear,
  popupScrollHandler,
  isDebouncedFetch,
}: {
  currentState: SelectBlockState;
  finalOptions: SelectOption[];
  finalDefaultValue:
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | undefined;
  finalValue:
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | undefined;
  onSearch: (searchValue: string) => void;
  handlePaste: (event: ClipboardEvent) => void;
  handleVisibleChange: (visible: boolean) => void;
  handleClear: (visible: boolean) => void;
  popupScrollHandler: (event: unknown) => void;
  isDebouncedFetch: boolean;
}) {
  // 构造最终返回值
  return useMemo(
    () => ({
      // 状态统一从插件管理器获取
      loading: currentState?.loading || false,
      fetching: currentState?.fetching || false,
      finalOptions,
      finalDefaultValue,
      finalValue,

      // 处理函数
      onSearch,
      handlePaste,
      handleVisibleChange,
      handleClear,
      popupScrollHandler,

      // 过滤选项
      filterOption: isDebouncedFetch ? false : defaultFilterOption,
    }),
    [
      currentState?.loading,
      currentState?.fetching,
      finalOptions,
      finalDefaultValue,
      finalValue,
      onSearch,
      handlePaste,
      handleVisibleChange,
      handleClear,
      popupScrollHandler,
      isDebouncedFetch,
    ],
  );
}
