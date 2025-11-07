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

import {
  convertLocalTimeRangeToUtc,
  convertUtcTimeRangeToLocal,
} from '@veaiops/utils';

/**
 * Default subscription validity: 100 years
 */
const DEFAULT_VALIDITY_YEARS = 100;

/**
 * Create default validity time range
 *
 * Returns time range from current time to 100 years later, used as default value when creating new subscription
 *
 * @returns [Current time, time 100 years later]
 *
 * @example
 * ```ts
 * const [start, end] = createDefaultTimeRange();
 * // start: 2025-10-29T00:00:00.000Z
 * // end: 2125-10-29T00:00:00.000Z
 * ```
 */
export const createDefaultTimeRange = (): [Date, Date] => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + DEFAULT_VALIDITY_YEARS);
  return [now, futureDate];
};

/**
 * Parse time range
 *
 * Converts UTC ISO format time strings to Date objects in user's local timezone for display.
 * Includes comprehensive error handling:
 * - Validates input is not empty
 * - Validates date format is valid
 * - Catches parsing exceptions
 *
 * @param startTime - Start time (UTC ISO string format)
 * @param endTime - End time (UTC ISO string format)
 * @returns Time range array in local timezone, returns undefined if time is invalid
 *
 * @example
 * ```ts
 * // Successfully parse
 * parseTimeRange('2025-01-01T00:00:00.000Z', '2025-12-31T23:59:59.999Z')
 * // [Date(2025-01-01 in local timezone), Date(2025-12-31 in local timezone)]
 *
 * // Handle empty values
 * parseTimeRange(null, null) // undefined
 * parseTimeRange('2025-01-01', null) // undefined
 *
 * // Handle invalid dates
 * parseTimeRange('invalid-date', '2025-12-31') // undefined
 * parseTimeRange('2025-13-32', '2025-12-31') // undefined
 * ```
 */
export const parseTimeRange = (
  startTime?: string | null,
  endTime?: string | null,
): [Date, Date] | undefined => {
  // Validate input exists
  if (!startTime || !endTime) {
    return undefined;
  }

  try {
    // Convert UTC time range to local timezone for display
    const localRange = convertUtcTimeRangeToLocal([startTime, endTime]);

    if (!localRange) {
      return undefined;
    }

    // Convert dayjs objects to Date objects
    return [localRange[0].toDate(), localRange[1].toDate()];
  } catch (error) {
    // Catch any parsing exceptions
    return undefined;
  }
};

/**
 * Format time range to UTC ISO strings
 *
 * Converts Date objects (in user's local timezone) to UTC ISO 8601 format strings for API requests.
 *
 * @param timeRange - Date object array (in user's local timezone)
 * @returns UTC ISO format time string array
 */
export const formatTimeRange = (
  timeRange?: [Date, Date],
): { startTime?: string; endTime?: string } => {
  if (!timeRange || timeRange.length !== 2) {
    return {};
  }

  const [start, end] = timeRange;

  // Convert Date objects to local time strings for convertLocalTimeRangeToUtc
  // ✅ 修复：使用本地时间字符串，避免 toISOString() 的二次UTC转换
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const dateStrings = [formatLocalDate(start), formatLocalDate(end)];

  // Use convertLocalTimeRangeToUtc to ensure proper timezone conversion
  const utcRange = convertLocalTimeRangeToUtc(dateStrings);

  if (!utcRange) {
    return {};
  }

  return {
    startTime: utcRange[0],
    endTime: utcRange[1],
  };
};
