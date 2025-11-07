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

import dayjs from 'dayjs';
import { isUndefined } from 'lodash-es';

/**
 * Calculate a timestamp based on time difference and unit
 * @param diff Time difference; how many units to go back from now
 * @param unit Time unit; one of 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
 * @param outputInSeconds Whether to output seconds; default false (outputs milliseconds)
 * @returns Calculated timestamp
 */
export const calculateTimestamp = (
  diff: number,
  unit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
  outputInSeconds = false,
): number => {
  const now: dayjs.Dayjs = dayjs(); // Get current time

  // Adjust time by the unit parameter
  const adjustedTime: dayjs.Dayjs = now.subtract(diff, unit);

  // Get adjusted timestamp
  let timestamp: number = adjustedTime.valueOf();

  // Whether to output seconds
  if (outputInSeconds) {
    timestamp = Math.floor(timestamp / 1000);
  }

  return timestamp;
};

/**
 * Calculate a timestamp range based on time difference and unit
 * @param diff 时间差，表示当前时刻倒退了多少unit
 * @param unit 时间单位，可选值为 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
 * @param outputInSeconds 是否输出时间戳为秒，默认为 false（输出毫秒）
 * @returns Calculated timestamp range array
 */
export const calculateTimestampRange = (
  diff: number,
  unit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
  outputInSeconds = false,
): number[] => {
  if (isUndefined(diff)) {
    return [];
  }
  const now: dayjs.Dayjs = dayjs(); // Get current time

  // Compute start and end times based on unit
  const endTime: dayjs.Dayjs = now;
  const startTime: dayjs.Dayjs = endTime.subtract(diff, unit);
  // Get timestamps for start and end times
  let startTimestamp: number = startTime.valueOf();
  let endTimestamp: number = endTime.valueOf();

  // Whether to output seconds
  if (outputInSeconds) {
    startTimestamp = Math.floor(startTimestamp / 1000);
    endTimestamp = Math.floor(endTimestamp / 1000);
  }

  // Generate the timestamp range array
  const timestampRange: number[] = [startTimestamp, endTimestamp];
  return timestampRange;
};

/**
 * Generate time difference relative to a given timestamp
 * @param {number} timestamp The given timestamp
 * @param {string} unit Time unit; one of 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
 * @param {number} diff Difference relative to now
 * @param {boolean} isFuture Whether to compute forward from now; default true
 * @param {boolean} inputInSeconds Whether to return the difference in seconds; default false (returns milliseconds)
 * @returns {number} Computed time difference
 */
export const calculateTimestampByDiffFromNow = ({
  unit,
  diff,
  isFuture = true,
}: {
  unit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
  diff: number;
  isFuture?: boolean;
}): number => {
  const now = dayjs(); // Get current time

  // Determine calculation direction based on isFuture
  const calculatedDate = isFuture
    ? now.add(diff, unit)
    : now.subtract(diff, unit);

  // Convert to seconds or milliseconds
  return calculatedDate.valueOf();
};

/**
 * Compute time by startTime, offset, and operation.
 * @param startTime Start time in "YYYY-MM-DD HH:mm:ss".
 * @param offset Offset in format "1h" 或 "1m"。
 * @param operation Operation: "add" (default), "subtract", "multiply" or "divide".
 * @returns Calculated time in ISO 8601 format.
 */
export const calculateTimeByOffset = (
  startTime: string,
  offset: string,
  operation = 'add',
): string => {
  // Convert startTime to a Date object
  const startDate = new Date(startTime);

  // Extract amount and unit from offset
  const amount = Number(offset.slice(0, -1));
  const unit = offset.slice(-1);

  // Compute new date based on operation
  let newDate: Date;
  if (operation === 'add') {
    newDate = new Date(startDate.getTime());
    if (unit === 'h') {
      newDate.setHours(startDate.getHours() + amount);
    } else if (unit === 'm') {
      newDate.setMinutes(startDate.getMinutes() + amount);
    }
  } else if (operation === 'subtract') {
    newDate = new Date(startDate.getTime());
    if (unit === 'h') {
      newDate.setHours(startDate.getHours() - amount);
    } else if (unit === 'm') {
      newDate.setMinutes(startDate.getMinutes() - amount);
    }
  } else if (operation === 'multiply') {
    newDate = new Date(startDate.getTime());
    if (unit === 'h') {
      newDate.setHours(startDate.getHours() * amount);
    } else if (unit === 'm') {
      newDate.setMinutes(startDate.getMinutes() * amount);
    }
  } else if (operation === 'divide') {
    newDate = new Date(startDate.getTime());
    if (unit === 'h') {
      newDate.setHours(Math.floor(startDate.getHours() / amount));
    } else if (unit === 'm') {
      newDate.setMinutes(Math.floor(startDate.getMinutes() / amount));
    }
  } else {
    return '无效的操作';
  }

  return newDate.toISOString();
};

/**
 * Check whether the given startTime, endTime, and offset fall within the allowed range.
 * @param params Object containing startTime, endTime, and offset
 * @returns true if endTime - startTime is within the offset range; otherwise false
 */
export const checkOffsetRange = ({
  startTime,
  endTime,
  offset,
}: {
  startTime: string;
  endTime: string;
  offset: string;
}): boolean => {
  // Convert startTime and endTime to Date objects
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  // Extract amount and unit from offset
  const amount = Number(offset.slice(0, -1));
  const unit = offset.slice(-1);

  // Calculate the time difference
  let timeDiff: number;
  if (unit === 'h') {
    timeDiff =
      Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 3600); // Convert milliseconds to hours
  } else if (unit === 'm') {
    timeDiff = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60); // Convert milliseconds to minutes
  } else {
    return false; // Unsupported unit
  }

  // Check whether the difference is within the offset range
  return timeDiff <= amount;
};
