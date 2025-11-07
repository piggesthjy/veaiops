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

import { Select } from '@arco-design/web-react';
import Notification from '@arco-design/web-react/es/Notification';
import { IconPublic } from '@arco-design/web-react/icon';
import { CellRender } from '@veaiops/components';
import {
  SUPPORTED_TIMEZONES,
  getUserTimezone,
  logger,
  setUserTimezone,
} from '@veaiops/utils';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

// Extend dayjs timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Timezone selector component
 *
 * Allows users to select their preferred timezone for displaying timestamps.
 * The selected timezone is stored in localStorage and used throughout the application.
 */
export const TimezoneSelector: FC = () => {
  const [currentTimezone, setCurrentTimezone] = useState<string>(
    getUserTimezone(),
  );

  useEffect(() => {
    const detectedTimezone = getUserTimezone();
    setCurrentTimezone(detectedTimezone);

    logger.debug({
      message: 'Timezone selector initialized',
      data: {
        detectedTimezone,
        timestamp: new Date().toISOString(),
      },
      source: 'TimezoneSelector',
      component: 'useEffect',
    });
  }, []);

  const handleChange = (value: string) => {
    logger.info({
      message: 'User changed timezone',
      data: {
        previousTimezone: currentTimezone,
        newTimezone: value,
        timestamp: new Date().toISOString(),
      },
      source: 'TimezoneSelector',
      component: 'handleChange',
    });

    // Find selected timezone display info
    const selectedTimezone = SUPPORTED_TIMEZONES.find(
      (tz) => tz.value === value,
    );
    const timezoneName = selectedTimezone?.label || value;
    const timezoneOffset = selectedTimezone?.extra?.offset || '';

    if (setUserTimezone(value)) {
      setCurrentTimezone(value);

      // ✅ Optional: Update dayjs default timezone (for scenarios requiring unified default timezone)
      try {
        dayjs.tz.setDefault(value);
      } catch (error: unknown) {
        // Silent handling: dayjs timezone setting failure does not affect functionality
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.debug({
          message: 'Failed to set dayjs default timezone',
          data: {
            error: errorObj.message,
            timezone: value,
          },
          source: 'TimezoneSelector',
          component: 'handleChange',
        });
      }

      logger.info({
        message: 'Timezone change saved',
        data: {
          timezone: value,
          timezoneName,
          timezoneOffset,
          timestamp: new Date().toISOString(),
        },
        source: 'TimezoneSelector',
        component: 'handleChange',
      });

      // ✅ Show notification
      Notification.success({
        title: '时区已切换',
        content: `当前时区：${timezoneName} ${timezoneOffset}`,
        duration: 3000,
        position: 'topRight',
        showIcon: true,
      });

      // ✅ Event-driven: Dispatch global event to notify all modules that timezone has changed
      // Modules can listen to this event to refresh data without full page reload
      window.dispatchEvent(
        new CustomEvent('veaiops:timezoneChanged', {
          detail: {
            timezone: value,
            name: timezoneName,
            offset: timezoneOffset,
          },
        }),
      );
    } else {
      logger.error({
        message: 'Failed to save timezone preference',
        data: {
          timezone: value,
          timestamp: new Date().toISOString(),
        },
        source: 'TimezoneSelector',
        component: 'handleChange',
      });

      Notification.error({
        title: '时区切换失败',
        content: '无法保存时区设置，请稍后重试',
        duration: 3000,
        position: 'topRight',
        showIcon: true,
      });
    }
  };

  // Find the display name of the currently selected timezone
  const currentLabel =
    SUPPORTED_TIMEZONES.find((tz) => tz.value === currentTimezone)?.label ||
    currentTimezone;

  return (
    <Select
      value={currentTimezone}
      onChange={handleChange}
      style={{ width: 250 }}
      placeholder="Select Timezone"
      prefix={
        <IconPublic
          style={{
            fontSize: 16,
            color: 'var(--color-text-2)',
          }}
        />
      }
      renderFormat={() => (
        <CellRender.Ellipsis text={currentLabel} style={{ maxWidth: 230 }} />
      )}
    >
      {SUPPORTED_TIMEZONES.map((tz) => (
        <Select.Option key={tz.value} value={tz.value}>
          <CellRender.Ellipsis text={tz.label} style={{ maxWidth: 230 }} />
        </Select.Option>
      ))}
    </Select>
  );
};
