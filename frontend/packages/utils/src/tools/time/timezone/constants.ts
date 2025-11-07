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
 * Timezone constants
 * All timezone-related constant definitions
 */

/**
 * Timezone preference storage key in localStorage
 */
export const TIMEZONE_STORAGE_KEY = 'veaiops_user_timezone';

/**
 * Default timezone (used when user hasn't set one)
 * Fallback when browser timezone detection fails
 */
export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

/**
 * Common timezones (priority list for UI display)
 * These are the most commonly used timezones, shown at the top of the selector
 */
export const COMMON_TIMEZONES = [
  'Asia/Shanghai',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Australia/Sydney',
] as const;

/**
 * Timezone display names (localized)
 * Maps timezone identifiers to user-friendly display names
 */
export const TIMEZONE_DISPLAY_NAMES: Record<string, string> = {
  'Asia/Shanghai': '中国标准时间 (CST)',
  UTC: '协调世界时 (UTC)',
  'America/New_York': '美国东部时间 (EST/EDT)',
  'America/Los_Angeles': '美国西部时间 (PST/PDT)',
  'Europe/London': '英国时间 (GMT/BST)',
  'Europe/Paris': '中欧时间 (CET/CEST)',
  'Asia/Tokyo': '日本标准时间 (JST)',
  'Asia/Singapore': '新加坡时间 (SGT)',
  'Asia/Hong_Kong': '香港时间 (HKT)',
  'Australia/Sydney': '澳大利亚东部时间 (AEDT/AEST)',
};
