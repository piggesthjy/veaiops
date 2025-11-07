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
 * Timezone UTC offset calculation utilities
 */

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Get UTC offset for a timezone
 * Dynamically calculates current offset (handles DST automatically)
 *
 * @param timezone - IANA timezone identifier
 * @returns Formatted UTC offset string (e.g., 'UTC+8', 'UTC-5')
 */
export const getTimezoneOffset = (timezone: string): string => {
  try {
    const tzDate = dayjs().tz(timezone);
    const offset = tzDate.utcOffset() / 60; // Convert minutes to hours

    if (offset === 0) {
      return 'UTC+0';
    }

    const sign = offset > 0 ? '+' : '';
    return `UTC${sign}${offset}`;
  } catch {
    return 'UTC+0';
  }
};
