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

import { EMPTY_CONTENT_TEXT } from '@veaiops/constants';
import dayjs from 'dayjs';
import { logger } from './logger/index';
import { formatUtcToLocal } from './time/timezone';

export const formatDate = (
  date: string | Date,
  format = 'YYYY-MM-DD HH:mm:ss',
) => {
  return dayjs(date).format(format);
};

export const getRelativeTime = (date: string | Date) => {
  // Simple relative time calculation; avoid using plugins
  const now = dayjs();
  const target = dayjs(date);
  const diff = now.diff(target, 'minute');

  if (diff < 1) {
    return '刚刚';
  }
  if (diff < 60) {
    return `${diff}分钟前`;
  }

  const hours = Math.floor(diff / 60);
  if (hours < 24) {
    return `${hours}小时前`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}天前`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}个月前`;
  }

  const years = Math.floor(months / 12);
  return `${years}年前`;
};

/**
 * Format date-time for display
 *
 * Note: This function assumes input is UTC time and automatically converts to user's preferred timezone.
 * Uses formatUtcToLocal internally for consistent timezone handling.
 *
 * @param dateInput Date input; supports string (UTC ISO 8601), Date, timestamp, null or undefined
 * @param showSeconds Whether to show seconds; default false
 * @returns Formatted time string; returns "-" for empty values
 */
export const formatDateTime = (
  dateInput: string | Date | number | undefined | null,
  showSeconds = false,
) => {
  // Handle empty values
  if (dateInput == null || dateInput === '') {
    return EMPTY_CONTENT_TEXT;
  }

  // Boundary check: handle empty string after trimming
  if (typeof dateInput === 'string' && dateInput.trim() === '') {
    return EMPTY_CONTENT_TEXT;
  }

  // Boundary check: handle invalid number (NaN, Infinity, etc.)
  if (typeof dateInput === 'number' && !Number.isFinite(dateInput)) {
    return EMPTY_CONTENT_TEXT;
  }

  // Use formatUtcToLocal for consistent timezone conversion
  try {
    const format = showSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm';

    // ✅ 记录格式化调用
    logger.debug({
      message: 'formatDateTime called',
      data: {
        dateInput:
          typeof dateInput === 'object' ? dateInput?.toString() : dateInput,
        showSeconds,
        format,
      },
      source: 'DateUtils',
      component: 'formatDateTime',
    });

    const formatted = formatUtcToLocal(dateInput, format);

    // Boundary check: if formatUtcToLocal returns empty string, return EMPTY_CONTENT_TEXT
    if (!formatted || formatted === '') {
      logger.warn({
        message: 'formatUtcToLocal returned empty string',
        data: {
          dateInput:
            typeof dateInput === 'object' ? dateInput?.toString() : dateInput,
          format,
        },
        source: 'DateUtils',
        component: 'formatDateTime',
      });
      return EMPTY_CONTENT_TEXT;
    }

    logger.debug({
      message: 'formatDateTime result',
      data: {
        dateInput:
          typeof dateInput === 'object' ? dateInput?.toString() : dateInput,
        formatted,
      },
      source: 'DateUtils',
      component: 'formatDateTime',
    });

    return formatted;
  } catch (error: unknown) {
    // Fallback to basic formatting if timezone conversion fails
    const errorObj = error instanceof Error ? error : new Error(String(error));
    try {
      // Fallback: use Date object directly (will use browser local timezone)
      let date: Date;

      if (dateInput instanceof Date) {
        // Boundary check: invalid Date object
        if (Number.isNaN(dateInput.getTime())) {
          return EMPTY_CONTENT_TEXT;
        }
        date = dateInput;
      } else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
        // Boundary check: invalid timestamp
        if (Number.isNaN(date.getTime())) {
          return EMPTY_CONTENT_TEXT;
        }
      } else {
        date = new Date(dateInput);
        // Boundary check: invalid date string
        if (Number.isNaN(date.getTime())) {
          return EMPTY_CONTENT_TEXT;
        }
      }

      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      };

      if (showSeconds) {
        options.second = '2-digit';
      }

      return date.toLocaleString('zh-CN', options);
    } catch (fallbackError: unknown) {
      // Final fallback: return string representation
      if (process.env.NODE_ENV === 'development') {
        const fallbackErrorObj =
          fallbackError instanceof Error
            ? fallbackError
            : new Error(String(fallbackError));
        console.warn(
          '[DateUtils] Date formatting failed (including timezone conversion and fallback)',
          fallbackErrorObj.message,
          {
            dateInput,
            originalError: errorObj.message,
          },
        );
      }
      return EMPTY_CONTENT_TEXT;
    }
  }
};

/**
 * Disable all dates after today
 * For the disabledDate prop of DatePicker/RangePicker
 * @param current Current date
 * @returns true if the date should be disabled
 */
export const disabledDate = (current: dayjs.Dayjs) => {
  return current?.isAfter(dayjs(), 'day');
};
