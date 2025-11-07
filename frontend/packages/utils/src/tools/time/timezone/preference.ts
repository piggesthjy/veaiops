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
 * User timezone preference management
 * Handles reading and writing timezone preferences to localStorage
 */

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { logger } from '../../logger/index';
import { TIMEZONE_STORAGE_KEY } from './constants';
import { detectBrowserTimezone } from './detector';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Get user timezone preference
 *
 * Priority:
 * 1. User preference stored in localStorage
 * 2. Browser timezone
 * 3. Default timezone (Asia/Shanghai)
 *
 * @returns Timezone string (IANA timezone identifier)
 */
export function getUserTimezone(): string {
  try {
    // Read user preference from localStorage
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (stored && typeof stored === 'string') {
      // Validate if timezone is valid
      try {
        dayjs.tz.setDefault(stored);

        logger.info({
          message: 'User timezone loaded from localStorage',
          data: {
            timezone: stored,
            timestamp: new Date().toISOString(),
            browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          source: 'TimezonePreference',
          component: 'getUserTimezone',
        });

        return stored;
      } catch (error: unknown) {
        // Timezone invalid, clear and fallback
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.warn({
          message: 'Stored timezone is invalid, clearing localStorage',
          data: {
            invalidTimezone: stored,
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
          source: 'TimezonePreference',
          component: 'getUserTimezone',
        });

        localStorage.removeItem(TIMEZONE_STORAGE_KEY);
      }
    }
  } catch (error: unknown) {
    // localStorage unavailable or read failed, silently handle
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.warn({
      message: 'Failed to read timezone preference',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
      },
      source: 'TimezonePreference',
      component: 'getUserTimezone',
    });
  }

  // Fallback to browser timezone
  logger.debug({
    message: 'No user timezone preference, falling back to browser timezone',
    data: {
      timestamp: new Date().toISOString(),
    },
    source: 'TimezonePreference',
    component: 'getUserTimezone',
  });

  return detectBrowserTimezone();
}

/**
 * Set user timezone preference
 * Validates timezone and saves to localStorage
 *
 * @param timezone - Timezone string (IANA timezone identifier, e.g., 'Asia/Shanghai')
 * @returns Whether setting was successful
 */
export function setUserTimezone(timezone: string): boolean {
  logger.debug({
    message: 'Attempting to set user timezone',
    data: {
      timezone,
      timestamp: new Date().toISOString(),
    },
    source: 'TimezonePreference',
    component: 'setUserTimezone',
  });

  try {
    // Validate if timezone is valid
    try {
      dayjs.tz.setDefault(timezone);
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: 'Invalid timezone',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
          timezone,
        },
        source: 'TimezonePreference',
        component: 'setUserTimezone',
      });
      return false;
    }

    // Save to localStorage
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);

    logger.info({
      message: 'User timezone saved successfully',
      data: {
        timezone,
        storageKey: TIMEZONE_STORAGE_KEY,
        timestamp: new Date().toISOString(),
      },
      source: 'TimezonePreference',
      component: 'setUserTimezone',
    });

    return true;
  } catch (error: unknown) {
    // localStorage unavailable or save failed
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({
      message: 'Failed to save timezone preference',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
        timezone,
      },
      source: 'TimezonePreference',
      component: 'setUserTimezone',
    });
    return false;
  }
}
