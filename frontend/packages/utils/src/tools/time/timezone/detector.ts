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
 * Browser timezone detection
 */

import { logger } from '../../logger/index';
import { DEFAULT_TIMEZONE } from './constants';

/**
 * Detect browser timezone
 * Uses Intl.DateTimeFormat API to get system timezone
 *
 * @returns Browser timezone (IANA timezone identifier, e.g., 'Asia/Shanghai')
 */
export function detectBrowserTimezone(): string {
  try {
    // Use Intl.DateTimeFormat to get browser timezone
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
    if (timeZone) {
      logger.debug({
        message: 'Browser timezone detected successfully',
        data: {
          detectedTimezone: timeZone,
          timestamp: new Date().toISOString(),
        },
        source: 'TimezoneDetector',
        component: 'detectBrowserTimezone',
      });
      return timeZone;
    }
  } catch (error: unknown) {
    // Silently handle error, fallback to default timezone
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.warn({
      message: 'Failed to detect browser timezone',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
        fallbackTimezone: DEFAULT_TIMEZONE,
      },
      source: 'TimezoneDetector',
      component: 'detectBrowserTimezone',
    });
  }

  // Fallback to default timezone
  logger.debug({
    message: 'Using default timezone',
    data: {
      defaultTimezone: DEFAULT_TIMEZONE,
      reason: 'Browser timezone not available',
    },
    source: 'TimezoneDetector',
    component: 'detectBrowserTimezone',
  });

  return DEFAULT_TIMEZONE;
}
