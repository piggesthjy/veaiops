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

import { useEffect, useState } from 'react';
import { getUserTimezone } from '../tools/time/timezone';

/**
 * Timezone Hook
 *
 * Automatically responds to timezone changes. When timezone switches, all components using this Hook will automatically re-render
 *
 * @returns Current user-selected timezone
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const timezone = useTimezone();
 *
 *   // When timezone changes, component will automatically re-render using the latest timezone value
 *   const formattedTime = formatUtcToLocal(utcTime, 'YYYY-MM-DD HH:mm:ss', timezone);
 *
 *   return <div>{formattedTime}</div>;
 * }
 * ```
 */
export function useTimezone(): string {
  const [timezone, setTimezone] = useState<string>(getUserTimezone());

  useEffect(() => {
    // Listen to custom event (within same tab, triggered when timezone selector switches)
    const handleTimezoneChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        timezone: string;
        name: string;
        offset: string;
      }>;
      setTimezone(customEvent.detail.timezone);
    };

    // Listen to storage event (cross-tab communication, triggered when other tabs switch timezone)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'veaiops_timezone' && event.newValue) {
        setTimezone(event.newValue);
      }
    };

    window.addEventListener('veaiops:timezoneChanged', handleTimezoneChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(
        'veaiops:timezoneChanged',
        handleTimezoneChange,
      );
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return timezone;
}
