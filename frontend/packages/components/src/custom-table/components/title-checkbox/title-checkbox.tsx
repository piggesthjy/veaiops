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

import { ColumnConstant, EMPTY_CONTENT } from '@/custom-table/constants';
import type { CustomCheckBoxProps } from '@/custom-table/types/components/title-checkbox';
import { Checkbox } from '@arco-design/web-react';
import type { FC, MouseEvent } from 'react';
/**
 * 标题复选框组件
 * @description 用于表格标题区域的复选框控件，支持查询和过滤功能

 *
 */
const TitleCheckbox: FC<CustomCheckBoxProps> = ({
  visible = true,
  title,
  label,
  defaultValue,
  emptyColumnDataIndex,
  queryDataIndex,
  onChange,
}) => {
  /**
   * 生成值对象
   * @param key - 对象键名
   * @param value - 对象值
   * @returns 生成的对象或 undefined
   */
  const generateValueObject = (
    key: string | undefined,
    value?: unknown,
  ): Record<string, unknown> | undefined => {
    if (!key) {
      return undefined;
    }
    const obj: Record<string, unknown> = {};
    obj[key] = value;
    return obj;
  };

  /**
   * 处理复选框状态变化
   * @param nextValue - 新的复选框状态
   */
  const handleChange = (nextValue?: boolean) => {
    let changeType: string | undefined;
    let key: string | undefined;

    if (queryDataIndex) {
      changeType = 'query';
      key = queryDataIndex;
    } else if (emptyColumnDataIndex) {
      changeType = 'filters';
      key = `${ColumnConstant.EMPTY}.${emptyColumnDataIndex}`;
    } else {
      changeType = undefined;
      key = undefined;
    }

    const value = nextValue
      ? generateValueObject(key, nextValue)
      : generateValueObject(key);

    onChange?.(changeType || '', value);
  };

  return (
    <div className="flex gap-[10px]">
      {title}
      {visible && (
        <Checkbox
          defaultChecked={defaultValue}
          onClick={(event: MouseEvent) => {
            event.stopPropagation();
          }}
          onChange={(v: boolean) => {
            handleChange(v);
          }}
        >
          <span className="text-gray-6 text-12">{label || EMPTY_CONTENT}</span>
        </Checkbox>
      )}
    </div>
  );
};

export { TitleCheckbox };
