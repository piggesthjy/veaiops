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

import { formatDateTime as formatDateTimeUtils } from '@veaiops/utils';

/**
 * Format time display
 * ✅ Use unified formatDateTime, supports timezone conversion
 */
export const formatDateTime = (dateString: string): string => {
  return formatDateTimeUtils(dateString, false); // false = do not show seconds
};

/**
 * Format date display (date only)
 * ✅ Use unified formatDateTime, supports timezone conversion
 */
export const formatDate = (dateString: string): string => {
  // Use formatDateTime but only take the date part
  const formatted = formatDateTimeUtils(dateString, false);
  // If format is "YYYY-MM-DD HH:mm:ss", only take the first 10 characters (date part)
  return formatted.split(' ')[0] || dateString;
};
