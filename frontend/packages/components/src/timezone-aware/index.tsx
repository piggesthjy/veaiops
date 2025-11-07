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

/**
 * Timezone-aware Arco Design components
 *
 * Automatically injects user-selected timezone to ensure date pickers display correct dates and times
 * Zero-intrusion design: business code only needs to change import path, other code remains unchanged
 */

import { DatePicker as ArcoDatePicker } from '@arco-design/web-react';
import type {
  DatePickerProps,
  RangePickerProps,
} from '@arco-design/web-react/es/DatePicker';
import { logger, useTimezone } from '@veaiops/utils';
import type { FC } from 'react';
import { useEffect } from 'react';

/**
 * Timezone-aware RangePicker
 *
 * ✅ Automatically injects user-selected timezone
 * ✅ Automatically re-renders when timezone changes
 * ✅ Zero-intrusion design: directly replace the original RangePicker
 *
 * @example
 * ```typescript
 * // ❌ Old code
 * import { DatePicker } from '@arco-design/web-react';
 * const { RangePicker } = DatePicker;
 *
 * // ✅ New code (zero-intrusion, only need to change import)
 * import { RangePicker } from '@veaiops/components';
 *
 * // Usage is exactly the same, timezone will be automatically injected
 * <RangePicker
 *   placeholder={['开始时间', '结束时间']}
 *   showTime
 *   onChange={handleChange}
 * />
 * ```
 */
export const TimezoneAwareRangePicker: FC<RangePickerProps> = (props) => {
  const timezone = useTimezone(); // ✅ Automatically get user-selected timezone

  // 🔥 Debug log: confirm timezone is correctly passed
  useEffect(() => {
    logger.info({
      message: 'TimezoneAwareRangePicker rendered',
      data: {
        timezone,
        propsTimezone: props.timezone,
        finalTimezone: props.timezone || timezone,
        timestamp: new Date().toISOString(),
      },
      source: 'TimezoneAwareRangePicker',
      component: 'render',
    });
  }, [timezone, props.timezone]);

  return (
    <ArcoDatePicker.RangePicker
      {...props}
      timezone={timezone} // ✅ Automatically inject timezone to ensure calendar panel displays correct date
    />
  );
};

/**
 * Timezone-aware DatePicker
 *
 * ✅ Automatically injects user-selected timezone
 * ✅ Automatically re-renders when timezone changes
 * ✅ Zero-intrusion design: directly replace the original DatePicker
 */
export const TimezoneAwareDatePicker: FC<DatePickerProps> = (props) => {
  const timezone = useTimezone(); // ✅ Automatically get user-selected timezone

  return (
    <ArcoDatePicker
      {...props}
      timezone={timezone} // ✅ Automatically inject timezone
    />
  );
};

// ✅ Export aliases for convenience
export { TimezoneAwareRangePicker as RangePicker };
export { TimezoneAwareDatePicker as DatePicker };
