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

import { useRef } from 'react';
import { logger } from '../logger';
import type { SelectOption, veArchSelectBlockProps } from '../types/interface';

/**
 * 基础配置Hook
 * 负责处理props解构、基础配置计算、渲染计数等
 */
export function useBaseConfig(props: veArchSelectBlockProps) {
  const hookTraceId = logger.generateTraceId();

  // 🔧 详细记录 dataSource 信息
  const dataSourceInfo = props.dataSource
    ? {
        type: typeof props.dataSource,
        isObject:
          typeof props.dataSource === 'object' && props.dataSource !== null,
        keys:
          typeof props.dataSource === 'object' && props.dataSource !== null
            ? Object.keys(props.dataSource)
            : [],
        api:
          typeof props.dataSource === 'object' && props.dataSource !== null
            ? (props.dataSource as any).api
            : undefined,
        hasServiceInstance:
          typeof props.dataSource === 'object' && props.dataSource !== null
            ? 'serviceInstance' in props.dataSource
            : false,
      }
    : null;

  logger.info(
    'UseSelectBlock',
    '🟡 Hook开始执行 (useBaseConfig)',
    {
      propsKeys: Object.keys(props),
      // 🎯 重点：dependency 追踪
      hasDependency: Boolean(props.dependency),
      dependency: props.dependency,
      dependencyString: JSON.stringify(props.dependency),
      dependencyType: typeof props.dependency,
      dependencyIsArray: Array.isArray(props.dependency),
      dependencyLength: Array.isArray(props.dependency)
        ? props.dependency.length
        : 0,
      dependencyFirstItem: Array.isArray(props.dependency)
        ? props.dependency[0]
        : undefined,
      // dataSource 信息
      hasDataSource: Boolean(props.dataSource),
      dataSourceInfo,
      // 其他信息
      hasInitialOptions: Boolean(props.options?.length),
      mode: props.mode,
      placeholder: props.placeholder,
      disabled: props.disabled,
      canFetch: props.canFetch,
      isDebouncedFetch: props.isDebouncedFetch,
      id: props.id,
    },
    'useSelectBlock',
    hookTraceId,
  );

  // Props解构
  const {
    options: rawInitialOptions = [],
    isDebouncedFetch = false,
    defaultActiveFirstOption = false,
    value,
    onChange,
    dataSource,
    dataSourceShare = false,
    isFirstHint = false,
    dependency,
  } = props;

  // 🔧 解构后再次检查 dependency 和 dataSource
  logger.debug(
    'UseSelectBlock',
    '🟡 Props 解构完成 (useBaseConfig)',
    {
      // dependency 解构后
      hasDependencyAfterDestructure: Boolean(dependency),
      dependencyAfterDestructure: dependency,
      dependencyStringAfterDestructure: JSON.stringify(dependency),
      // dataSource 解构后
      hasDataSourceAfterDestructure: Boolean(dataSource),
      dataSourceTypeAfterDestructure: typeof dataSource,
      dataSourceIsNull: dataSource === null,
      dataSourceIsUndefined: dataSource === undefined,
      dataSourceApiAfterDestructure:
        dataSource && typeof dataSource === 'object' && 'api' in dataSource
          ? (dataSource as any).api
          : undefined,
    },
    'useSelectBlock',
    hookTraceId,
  );

  // 确保initialOptions是正确的SelectOption[]类型
  const initialOptions = (rawInitialOptions || []) as SelectOption[];

  // Hook渲染计数器
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // 获取 limit 属性，如果不存在则使用默认值 100
  const limit = props?.pageReq?.limit || 100;

  logger.debug(
    'UseSelectBlock',
    '基础配置初始化',
    {
      limit,
      renderCount: renderCountRef.current,
    },
    'useSelectBlock',
    hookTraceId,
  );

  // 🔧 全链路追踪标记点 2：useBaseConfig
  logger.info(
    'UseBaseConfig',
    '🟠 [全链路-2] Props 解构完成',
    {
      fromProps: props.defaultActiveFirstOption,
      afterDestructure: defaultActiveFirstOption,
      value,
      mode: props.mode,
      hasOnChange: Boolean(onChange),
      willPassToUseSelectBlock: {
        defaultActiveFirstOption,
        value,
        mode: props.mode,
      },
      traceId: hookTraceId,
    },
    'useBaseConfig',
    hookTraceId,
  );

  return {
    // 基础配置
    hookTraceId,
    initialOptions,
    limit,
    renderCountRef,

    // 解构的props
    isDebouncedFetch,
    defaultActiveFirstOption,
    value,
    onChange,
    dataSource,
    dataSourceShare,
    isFirstHint,
    dependency,
  };
}
