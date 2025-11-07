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

import type { FieldItem, HandleFilterProps } from "@veaiops/components";
import {
  convertLocalTimeRangeToUtc,
  convertUtcTimeRangeToLocal,
  disabledDate,
} from "@veaiops/utils";
import type { TaskFiltersQuery } from "./types";

/**
 * Update time range filter
 */
export const createUpdateTimeRangeFilter = (
  props: HandleFilterProps<TaskFiltersQuery>,
): FieldItem => {
  const { query, handleChange } = props;

  return {
    field: 'update_time_range',
    label: '更新时间',
    type: 'RangePicker',
    componentProps: {
      placeholder: ['开始时间', '结束时间'],
      // Display: UTC → Local Time
      value:
        query.updated_at_start && query.updated_at_end
          ? convertUtcTimeRangeToLocal([
              query.updated_at_start,
              query.updated_at_end,
            ])
          : undefined,
      showTime: true,
      disabledDate,
      // Note: RangePicker returns date strings in user timezone, need to convert to UTC
      onChange: (v: [string, string] | null) => {
        if (v && v.length === 2) {
          // Send: Local Time → UTC
          const utcRange = convertLocalTimeRangeToUtc(v);
          if (utcRange) {
            handleChange({
              updates: {
                updated_at_start: utcRange[0],
                updated_at_end: utcRange[1],
              },
            });
          }
        } else {
          handleChange({
            updates: {
              updated_at_start: undefined,
              updated_at_end: undefined,
            },
          });
        }
      },
    },
  };
};
