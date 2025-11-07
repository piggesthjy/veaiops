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

import type { ReactNode } from 'react';
import { useTimezone } from '../../hooks/use-timezone';
import { formatUtcToLocal } from './timezone';

/**
 * Higher-order component: wraps any component that renders time, automatically responds to timezone changes
 *
 * @example
 * ```typescript
 * const TimeDisplay = withTimezone(({ time }: { time: string }) => {
 *   return <div>{formatUtcToLocal(time)}</div>;
 * });
 *
 * // Usage: automatically re-renders when timezone changes
 * <TimeDisplay time={utcTime} />
 * ```
 */
export function withTimezone<P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> {
  return (props: P) => {
    // ✅ Use useTimezone Hook, automatically re-renders when timezone changes
    const timezone = useTimezone();

    // ✅ Component will automatically re-render using latest timezone
    return <Component {...props} />;
  };
}

/**
 * Time text component (automatically responds to timezone changes)
 *
 * Zero-intrusion design: use directly, no need to manually add Hook
 *
 * @example
 * ```typescript
 * // Use in table columns
 * {
 *   title: '创建时间',
 *   render: (value) => <TimeText time={value} />
 * }
 * ```
 */
export const TimeText: React.FC<{
  time: string | number | Date | null | undefined;
  format?: string;
  showSeconds?: boolean;
}> = ({ time, format, showSeconds = false }) => {
  // ✅ Use useTimezone Hook, automatically re-renders when timezone changes
  const timezone = useTimezone();

  if (!time) {
    return <>-</>;
  }

  // ✅ When timezone changes, formatUtcToLocal will re-execute using latest timezone
  const defaultFormat = showSeconds
    ? 'YYYY-MM-DD HH:mm:ss'
    : 'YYYY-MM-DD HH:mm';
  const formatted = formatUtcToLocal(time, format || defaultFormat);

  return <>{formatted || '-'}</>;
};
