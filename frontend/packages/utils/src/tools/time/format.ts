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

import { EMPTY_CONTENT, EMPTY_CONTENT_TEXT } from '@veaiops/constants';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { isUndefined } from 'lodash-es';
import type { ReactElement } from 'react';

import type { FormatDurationProps } from './constants';
import { DEFAULT_TIME_FORMAT_TEMPLATE } from './constants';
import { isMillisecondTimestamp } from './utils';

// Apply Day.js plugin(s)
dayjs.extend(duration);

/**
 * @description Format a standard timestamp.
 *
 * In our business context, negative timestamps shouldn't occur; non-positive values return an empty string.
 *
 * @param targetMoment Timestamp in milliseconds or seconds
 * @param template Format template, default 'YYYY-MM-DD HH:mm:ss'
 * @param compareMoment Timestamp to compare against, used to compute a time difference
 * @returns Formatted time string or difference
 */
export function formatTimestamp(
  targetMoment?: number,
  template?: string,
  compareMoment?: number,
): string;

export function formatTimestamp(
  targetMoment?: number,
  template?: string,
  compareMoment?: number,
  asString?: boolean,
): string | JSX.Element;

export function formatTimestamp(
  targetMoment?: number,
  template = DEFAULT_TIME_FORMAT_TEMPLATE,
  compareMoment?: number,
  asString = true,
): string | ReactElement {
  if (
    !Number.isFinite(targetMoment) ||
    isUndefined(targetMoment) ||
    targetMoment <= 0
  ) {
    return asString ? EMPTY_CONTENT_TEXT : EMPTY_CONTENT;
  }

  // Validate timestamp unit of targetMoment
  const normalizedTargetMoment = !isMillisecondTimestamp(targetMoment)
    ? targetMoment * 1000
    : targetMoment;

  if (compareMoment) {
    // Validate timestamp unit of compareMoment
    const normalizedCompareMoment = !isMillisecondTimestamp(compareMoment)
      ? compareMoment * 1000
      : compareMoment;

    const diff = dayjs.duration(
      normalizedCompareMoment - normalizedTargetMoment,
    ); // Calculate time difference

    if (template === 'year') {
      return `${diff.years()}年`;
    } else if (template === 'month') {
      return `${diff.months()}月`;
    } else if (template === 'day') {
      return `${diff.days()}天`;
    } else if (template === 'hour') {
      const roundedDiff = Math.round(diff.asHours()); // Round to the nearest whole hour
      return `${roundedDiff}小时`;
    } else if (template === 'second') {
      const roundedDiff = Math.round(diff.asSeconds()); // Round to the nearest whole second
      return `${roundedDiff}秒`;
    }
  }

  if (isMillisecondTimestamp(targetMoment)) {
    return dayjs(normalizedTargetMoment).format(template);
  }
  return dayjs.unix(targetMoment).format(template);
}

/**
 * @description Format a Unix timestamp (seconds).
 *
 * In our business context, negative timestamps shouldn't occur; non-positive values return an empty string.
 *
 * @param n Unix timestamp (seconds)
 * @param template Format template; default 'YYYY-MM-DD HH:mm:ss'
 */
export const formatUnixTimestamp = (
  n: number | string | undefined | null,
  template = DEFAULT_TIME_FORMAT_TEMPLATE,
) => {
  if (n === undefined || n === null) {
    return '';
  }
  const numValue = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(numValue) || numValue <= 0) {
    return '';
  }

  return dayjs.unix(numValue).format(template);
};

/**
 * Convert a timestamp to `${hours} hours ${minutes} minutes ${seconds} seconds` format.
 * @param timestamp - Timestamp value; milliseconds or seconds.
 * @param isMilliseconds - Whether the input is in milliseconds; default true.
 * @param isReturnTypeObject - Return type: object or string; default string
 * @returns Formatted string; returns undefined if timestamp is NaN, undefined, or null.
 */
export const formatDuration = ({
  duration: durationValue,
  isMilliseconds = true,
  isReturnTypeObject = false,
}: FormatDurationProps):
  | string
  | { hours: number; minutes: number; seconds: number }
  | undefined => {
  if (
    Number.isNaN(durationValue) ||
    durationValue === undefined ||
    durationValue === null
  ) {
    return undefined;
  }

  let totalSeconds: number = isMilliseconds
    ? Math.floor(durationValue / 1000)
    : durationValue;

  const hours: number = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes: number = Math.floor(totalSeconds / 60);
  const seconds: number = totalSeconds % 60;

  if (isReturnTypeObject) {
    return {
      hours,
      minutes,
      seconds,
    };
  }
  return `${hours} 小时 ${minutes} 分钟 ${seconds} 秒`;
};
