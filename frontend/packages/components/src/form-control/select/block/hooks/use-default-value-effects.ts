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

import { useDeepCompareEffect } from 'ahooks';
import { isEmpty } from 'lodash-es';
import { useEffect, useRef } from 'react';
import { logger } from '../logger';

/**
 * 默认值副作用Hook
 * 负责处理默认值相关的副作用逻辑
 */
export function useDefaultValueEffects({
  defaultActiveFirstOption,
  finalDefaultValue,
  onChange,
  value,
  mode,
}: {
  defaultActiveFirstOption: boolean;
  finalDefaultValue: unknown;
  onChange?: (value: unknown, option?: unknown) => void;
  value?: unknown;
  mode?: 'multiple' | 'tags';
}) {
  // 🔧 全链路追踪标记点 4：Hook 入口
  logger.info(
    'DefaultValueEffects',
    '🟢 [全链路-4] Hook 接收参数',
    {
      receivedDefaultActiveFirstOption: defaultActiveFirstOption,
      receivedFinalDefaultValue: finalDefaultValue,
      receivedValue: value,
      receivedMode: mode,
      hasOnChange: Boolean(onChange),
    },
    'hookEntry',
  );

  // 🔧 修复：使用ref标记是否已经触发过默认值设置，避免重复触发
  const hasTriggeredDefaultRef = useRef(false);
  const prevValueRef = useRef(value);

  // 监听 value 变化，如果从有值变为无值，重置标记
  useEffect(() => {
    const prevEmpty = isEmpty(prevValueRef.current);
    const currentEmpty = isEmpty(value);

    // 如果从有值变为无值，允许重新应用默认值
    if (!prevEmpty && currentEmpty) {
      hasTriggeredDefaultRef.current = false;
    }

    prevValueRef.current = value;
  }, [value]);

  // === 默认值副作用处理 ===
  useEffect(() => {
    // 🔧 全链路追踪标记点 5：useEffect 执行
    logger.info(
      'DefaultValueEffects',
      '🔵 [全链路-5] useEffect 被触发',
      {
        defaultActiveFirstOption,
        finalDefaultValue,
        value,
        mode,
        hasTriggered: hasTriggeredDefaultRef.current,
        dependencies: {
          defaultActiveFirstOption,
          finalDefaultValue,
          value,
          mode,
        },
      },
      'useEffect',
    );

    // 🔧 关键修复：只在以下情况触发onChange：
    // 1. defaultActiveFirstOption为true
    if (!defaultActiveFirstOption) {
      logger.debug(
        'DefaultValueEffects',
        '跳过：defaultActiveFirstOption 未启用',
        {},
        'useEffect',
      );
      return;
    }

    // 2. 有finalDefaultValue
    if (!finalDefaultValue) {
      logger.debug(
        'DefaultValueEffects',
        '跳过：无 finalDefaultValue',
        {},
        'useEffect',
      );
      return;
    }

    // 3. 当前value为空（避免覆盖用户已选择的值）
    // 对于多选模式，空数组也视为空值
    const isValueEmpty =
      mode === 'multiple' || mode === 'tags'
        ? isEmpty(value) || (Array.isArray(value) && value.length === 0)
        : value === undefined || value === null || value === '';

    if (!isValueEmpty) {
      logger.debug(
        'DefaultValueEffects',
        '跳过：value 不为空',
        { value, isValueEmpty, mode },
        'useEffect',
      );
      return;
    }

    // 4. value 已经等于 finalDefaultValue，避免重复触发
    const isValueMatchDefault =
      mode === 'multiple' || mode === 'tags'
        ? Array.isArray(value) &&
          Array.isArray(finalDefaultValue) &&
          value.length === finalDefaultValue.length &&
          value.every(
            (v: any, i: number) => v === (finalDefaultValue as any)[i],
          )
        : value === finalDefaultValue;

    if (isValueMatchDefault) {
      logger.debug(
        'DefaultValueEffects',
        '跳过：value 已匹配 finalDefaultValue',
        { value, finalDefaultValue },
        'useEffect',
      );
      return;
    }

    // 5. 还未触发过（避免重复触发）
    if (hasTriggeredDefaultRef.current) {
      logger.warn(
        'DefaultValueEffects',
        '⚠️ 跳过：已经触发过默认值',
        { hasTriggered: true },
        'useEffect',
      );
      return;
    }

    // 🔧 全链路追踪标记点 6：触发 onChange
    logger.info(
      'DefaultValueEffects',
      '🟢 [全链路-6] ✅ 即将触发 onChange - 自动填充默认值',
      {
        finalDefaultValue,
        currentValue: value,
        defaultActiveFirstOption,
        mode,
        willSetValue: finalDefaultValue,
        timestamp: new Date().toISOString(),
      },
      'useEffect',
    );

    // 传递undefined作为第二个参数，因为OptionInfo类型不可用
    onChange?.(finalDefaultValue, undefined as never);

    hasTriggeredDefaultRef.current = true;

    // 🔧 全链路追踪标记点 7：onChange 执行完成
    logger.info(
      'DefaultValueEffects',
      '🟣 [全链路-7] ✅ onChange 已执行完成',
      {
        setValue: finalDefaultValue,
        timestamp: new Date().toISOString(),
      },
      'useEffect',
    );
  }, [defaultActiveFirstOption, finalDefaultValue, value, mode]);
  // 注意：不包含 onChange，因为它通常是稳定的引用，包含它可能导致无限循环
}
