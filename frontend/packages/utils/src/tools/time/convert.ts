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

import dayjs from 'dayjs';
import { isNumber, pick } from 'lodash-es';
import {
  type ConvertToUnixTimestampProps,
  DEFAULT_TIME_FORMAT_TEMPLATE,
} from './constants';
import {
  canConvertToNumber as canConvertToNumberFromCommon,
  isMillisecondTimestamp,
  isSecondTimestamp,
} from './utils';

/**
 * 将字符串类型的时间转换为Unix时间戳
 * @param time 时间字符串
 * @param format 格式化模板（可选）
 * @returns 对应的Unix时间戳
 */
export const convertToUnixTimestamp = ({
  time,
  format = DEFAULT_TIME_FORMAT_TEMPLATE,
  isToSecondTimestamp = false,
  isToMillSecondTimestamp = false,
}: ConvertToUnixTimestampProps): number => {
  let unixTimestamp = time;
  if (typeof time === 'string') {
    if (format) {
      unixTimestamp = dayjs(time, format).valueOf();
    } else {
      unixTimestamp = dayjs(time).valueOf();
    }
  }
  if (
    isToSecondTimestamp &&
    typeof unixTimestamp === 'number' &&
    isMillisecondTimestamp(unixTimestamp)
  ) {
    unixTimestamp = Math.floor(unixTimestamp / 1000);
  }

  if (
    isToMillSecondTimestamp &&
    typeof unixTimestamp === 'number' &&
    isSecondTimestamp(unixTimestamp)
  ) {
    unixTimestamp *= 1000;
  }

  return unixTimestamp as number;
};

/**
 * 将字符串类型的时间范围转换为Unix时间戳范围
 * @param timeRange 时间范围数组，包含起始时间和结束时间
 * @param format 格式化模板（可选）
 * @param isToSecondTimestamp 是否转换为秒级时间戳（可选，默认为false）
 * @param isToMillSecondTimestamp 是否转换为毫秒级时间戳（可选，默认为false）
 * @returns 对应的Unix时间戳范围
 */
export const convertTimeRangeToUnixTimestampRange = ({
  timeRange,
  format = DEFAULT_TIME_FORMAT_TEMPLATE,
  isToSecondTimestamp = false,
  isToMillSecondTimestamp = true,
}: {
  timeRange: string[] | number[] | undefined;
  format?: string;
  isToSecondTimestamp?: boolean;
  isToMillSecondTimestamp?: boolean;
}): number[] => {
  if (!timeRange || timeRange.length === 0) {
    return [];
  }
  const [startTime, endTime] = timeRange.map((value) =>
    canConvertToNumberFromCommon(value) ? Number(value) : value,
  );
  // 如果是['1640995200000', '1672531199999']，转成数值类型数组后直接返回
  if (isNumber(startTime) && isNumber(endTime)) {
    return [startTime, endTime];
  }
  const convertedStartTime = convertToUnixTimestamp({
    time: startTime,
    format,
    isToSecondTimestamp,
    isToMillSecondTimestamp,
  });
  const convertedEndTime = convertToUnixTimestamp({
    time: endTime,
    format,
    isToSecondTimestamp,
    isToMillSecondTimestamp,
  });
  return [convertedStartTime, convertedEndTime];
};

/**
 * 将对象中指定的字段转换为时间戳并返回转换后的对象
 * @param fields 包含字段和对应值的对象
 * @returns 转换后的对象
 */
export const convertFieldsToTimestamp = <T>({
  fields,
  target,
  convertProps = {},
}: {
  fields: Array<string>;
  target: any;
  convertProps?: Omit<ConvertToUnixTimestampProps, 'time'>;
}): T => {
  const convertedFields: Record<string, string | number> = pick(target, fields);

  fields.forEach((field) => {
    const value = convertedFields[field];
    convertedFields[field] = convertToUnixTimestamp({
      time: value,
      isToMillSecondTimestamp: true,
      ...convertProps,
    });
  });

  const result = { ...target, ...convertedFields } as T;
  return result;
};
