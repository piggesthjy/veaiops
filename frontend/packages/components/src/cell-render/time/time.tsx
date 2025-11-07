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
import { formatUtcToLocal, useTimezone } from '@veaiops/utils';
import type { FC } from 'react';

const formatTimestamp = (
  time: number | string | undefined,
  template = 'YYYY-MM-DD HH:mm:ss',
  _compareMoment?: number,
): string => {
  if (!time) {
    return EMPTY_CONTENT_TEXT;
  }

  // ✅ Use timezone conversion function to ensure time is displayed correctly according to user-selected timezone
  // formatUtcToLocal automatically handles UTC to local timezone conversion
  const formatted = formatUtcToLocal(time, template);

  if (!formatted || formatted === '') {
    return EMPTY_CONTENT_TEXT;
  }

  return formatted;
};

/**
 * StampTime component
 *
 * ✅ Automatically responds to timezone changes: internally uses useTimezone Hook
 * When user switches timezone, all StampTime components will automatically re-render and display time in the new timezone
 *
 * Zero-intrusion design: business code requires no changes, just use <CellRender.StampTime /> directly
 */
const StampTimeRender: FC<{
  time: number | string | undefined;
  template?: string;
  compareMoment?: number;
}> = ({ time, template, compareMoment }) => {
  // ✅ 使用 useTimezone Hook，时区变化时自动重新渲染
  const timezone = useTimezone();

  // ✅ 时区变化时，formatTimestamp 会重新执行，使用最新时区
  return <>{formatTimestamp(time, template, compareMoment)}</>;
};

export { StampTimeRender };
