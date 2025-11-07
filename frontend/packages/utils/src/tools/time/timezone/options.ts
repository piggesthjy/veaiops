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
 * Timezone selector options generation
 * Dynamically generates timezone list for UI components
 */

import { COMMON_TIMEZONES, TIMEZONE_DISPLAY_NAMES } from './constants';
import { getTimezoneOffset } from './offset';

/**
 * Get all supported timezones
 * Dynamically generates timezone list with offset information
 *
 * @returns Array of timezone options for Select component
 */
export const getSupportedTimezones = () => {
  const timezones: Array<{
    label: string;
    value: string;
    extra: { offset: string; city: string };
  }> = [];

  // Add common timezones first
  for (const tz of COMMON_TIMEZONES) {
    const displayName = TIMEZONE_DISPLAY_NAMES[tz] || tz;
    const offset = getTimezoneOffset(tz);
    const city = tz.split('/')[1]?.replace('_', ' ') || tz;

    timezones.push({
      label: displayName,
      value: tz,
      extra: { offset, city },
    });
  }

  return timezones;
};

/**
 * Supported timezones (cached list)
 * Use getSupportedTimezones() to get the list dynamically
 */
export const SUPPORTED_TIMEZONES = getSupportedTimezones();
