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
 * 判断一个字符串是否可以被转换成数字
 * @param str 需要被检查的字符串
 * @return 如果字符串可以被转换成数字则返回true，否则返回false
 */
export const canConvertToNumber = (str: string | number | unknown): boolean => {
  if (!str) {
    return false;
  }
  const num = Number(str);
  const result = !Number.isNaN(num);
  return result;
};

/**
 * 判断一个时间戳是毫秒时间戳
 * @param timestamp 时间戳，可以是以秒为单位或毫秒为单位
 * @returns 如果时间戳是以毫秒为单位，则返回 true；否则返回 false
 */
export const isMillisecondTimestamp = (timestamp?: number | string): boolean =>
  timestamp?.toString().length === 13;

/**
 * 判断一个时间戳是秒时间戳
 * @param timestamp 时间戳，可以是以秒为单位或毫秒为单位
 * @returns 如果时间戳是以秒为单位，则返回 true；否则返回 false
 */
export const isSecondTimestamp = (timestamp?: number | string): boolean =>
  timestamp?.toString().length === 10;

/**
 * 检测一个时间范围数组中的元素是否全部为毫秒级时间戳
 * @param timeRange 待检测的时间范围数组
 * @returns 如果时间范围数组中的元素全部为毫秒级时间戳，则返回true，否则返回 false
 */
export const isTimeRangeWithMillSecondTimestamps = (
  timeRange: string[] | number[],
): boolean =>
  Array.isArray(timeRange) &&
  timeRange?.every((time) => isMillisecondTimestamp(time));

/**
 * 将毫秒时间戳数组转换为秒时间戳数组
 * @param millisecondTimestamps 毫秒时间戳数组
 * @returns 秒时间戳数组
 */
export const convertMillisecondsToSeconds = (
  millisecondTimestamps: number[],
): number[] => {
  return millisecondTimestamps.map((timestamp) => Math.floor(timestamp / 1000));
};

/**
 * 将分钟数转换为毫秒数
 * @param minutes 分钟数
 * @returns 转换后的毫秒数，如果分钟数不存在，则返回 undefined
 */
export const convertMinutesToMilliseconds = (
  minutes: number | undefined,
): number | undefined => {
  if (
    typeof minutes !== 'number' ||
    Number.isNaN(minutes) ||
    !Number.isFinite(minutes)
  ) {
    return undefined;
  }

  return minutes * 60000;
};

/**
 * 将时间解析为以秒为单位的结果。
 * @param time - 时间对象，包含以小时、分钟和秒为单位的时间值。
 * @param time.hours - 小时数，默认为 0。
 * @param time.minutes - 分钟数，默认为 0。
 * @param time.seconds - 秒数，默认为 0。
 * @returns 解析后的以秒为单位的时间值。
 */
export const parseTimeToSeconds = (
  props: { hours?: number; minutes?: number; seconds?: number } | undefined,
): number | undefined => {
  if (!props) {
    return undefined;
  }
  const { hours = 0, minutes = 0, seconds = 0 } = props;
  return hours * 3600 + minutes * 60 + seconds;
};
