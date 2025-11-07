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
import { IconDown } from '@arco-design/web-react/icon';
import React from 'react';

import './style/index.less';

import { useSelectBlock } from './hooks/use-select-block';
import { logger } from './logger';
import type { veArchSelectBlockProps } from './types/interface';

/**
 * 重构后的SelectBlock组件，使用插件系统架构
 * 🔧 使用 React.memo 优化重渲染
 */
const SelectBlockRefactoredInner = (props: veArchSelectBlockProps) => {
  const componentTraceId = logger.generateTraceId();

  // 🔧 使用 useRef 追踪渲染次数，避免日志爆炸
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;

  // 🔧 详细记录 dataSource 信息（所有渲染都记录）
  const dataSourceDetail =
    props.dataSource && typeof props.dataSource === 'object'
      ? {
          api: (props.dataSource as any).api,
          hasServiceInstance: 'serviceInstance' in props.dataSource,
          responseEntityKey: (props.dataSource as any).responseEntityKey,
          hasOptionCfg: 'optionCfg' in props.dataSource,
        }
      : null;

  // 🔧 全链路追踪标记点 1：组件入口
  logger.info(
    'SelectBlock',
    '🔴 [全链路-1] 组件接收 props',
    {
      renderCount: renderCountRef.current,
      addBefore: (props as any).addBefore,
      // 🎯 核心参数
      defaultActiveFirstOption: props.defaultActiveFirstOption,
      value: props.value,
      hasOnChange: Boolean(props.onChange),
      mode: props.mode,
      hasOptions: Boolean(props.options?.length),
      optionsLength: props.options?.length || 0,
      // dependency 详细信息
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
      dataSourceType: typeof props.dataSource,
      dataSourceDetail,
      // 其他关键信息
      placeholder: props.placeholder,
      disabled: props.disabled,
      canFetch: props.canFetch,
      isDebouncedFetch: props.isDebouncedFetch,
      id: props.id,
    },
    'SelectBlockRefactored',
    componentTraceId,
  );

  // 只记录前几次渲染和每隔10次的渲染
  if (renderCountRef.current <= 3 || renderCountRef.current % 10 === 0) {
    logger.info(
      'SelectBlock',
      '组件开始渲染',
      {
        renderCount: renderCountRef.current,
        props: {
          ...props,
          dataSource: props.dataSource ? '[DataSource]' : undefined,
        },
        traceId: componentTraceId,
      },
      'SelectBlockRefactored',
      componentTraceId,
    );
  }

  const {
    visible = true,
    inlineSuffixDom,
    wrapperStyle,
    style: propsStyle,
    allowPasteMultiple = false,
    ...restArcoSelectProps
  } = props;

  logger.debug(
    'SelectBlock',
    '组件props解析完成',
    {
      visible,
      hasInlineSuffixDom: Boolean(inlineSuffixDom),
      hasWrapperStyle: Boolean(wrapperStyle),
      allowPasteMultiple,
      restPropsKeys: Object.keys(restArcoSelectProps),
    },
    'SelectBlockRefactored',
    componentTraceId,
  );

  // 使用主Hook获取所有状态和处理函数
  const hookResult = useSelectBlock(props);

  const {
    loading,
    finalOptions,
    finalDefaultValue,
    finalValue,
    onSearch,
    handlePaste,
    handleVisibleChange,
    handleClear,
    popupScrollHandler,
    filterOption,
  } = hookResult;

  // 如果是多选模式且未设置allowClear，则默认为true
  const selectProps = { ...restArcoSelectProps };
  if (
    selectProps &&
    selectProps.mode === 'multiple' &&
    selectProps.allowClear === undefined
  ) {
    selectProps.allowClear = true;
  }

  // 🔍 包装onChange以添加日志（必须在条件返回之前定义，遵循 React Hooks 规则）
  const wrappedOnChange = React.useCallback(
    (value: any, option: any) => {
      logger.info(
        'SelectBlock',
        '🟢 onChange 被触发',
        {
          value,
          option,
          hasOriginalOnChange: Boolean(selectProps.onChange),
          placeholder: props.placeholder,
          addBefore: (props as any).addBefore,
          timestamp: new Date().toISOString(),
        },
        'onChange',
        componentTraceId,
      );

      // 调用原始的onChange
      if (selectProps.onChange) {
        logger.info(
          'SelectBlock',
          '🟢 调用原始 onChange',
          {
            value,
            onChangeFunctionName: selectProps.onChange.name || 'anonymous',
          },
          'onChange',
          componentTraceId,
        );
        selectProps.onChange(value, option);
        logger.info(
          'SelectBlock',
          '🟢 原始 onChange 已执行完成',
          { value },
          'onChange',
          componentTraceId,
        );
      } else {
        logger.warn(
          'SelectBlock',
          '⚠️ onChange 不存在!',
          {
            selectPropsKeys: Object.keys(selectProps),
          },
          'onChange',
          componentTraceId,
        );
      }
    },
    [selectProps.onChange, props.placeholder, componentTraceId],
  );

  // 如果不可见则不渲染（必须在所有 Hooks 调用之后）
  if (!visible) {
    logger.debug(
      'SelectBlock',
      '组件不可见，跳过渲染',
      { visible },
      'SelectBlockRefactored',
      componentTraceId,
    );
    return null;
  }

  logger.debug(
    'SelectBlock',
    'Hook执行结果',
    {
      loading,
      finalOptionsLength: finalOptions?.length || 0,
      finalDefaultValue,
      finalValue,
      hasOnSearch: Boolean(onSearch),
      hasHandlePaste: Boolean(handlePaste),
      hasHandleVisibleChange: Boolean(handleVisibleChange),
      hasPopupScrollHandler: Boolean(popupScrollHandler),
      hasFilterOption: Boolean(filterOption),
    },
    'SelectBlockRefactored',
    componentTraceId,
  );

  logger.debug(
    'SelectBlock',
    '多选模式自动设置allowClear=true',
    { mode: selectProps.mode },
    'SelectBlockRefactored',
    componentTraceId,
  );

  // 🔧 动态调整placeholder，提供搜索状态反馈
  let dynamicPlaceholder = '请选择';
  if (loading) {
    dynamicPlaceholder = '搜索中...';
  } else if (finalOptions?.length > 0) {
    dynamicPlaceholder = '请选择或输入搜索';
  }

  logger.debug(
    'SelectBlock',
    '动态placeholder计算完成',
    {
      loading,
      finalOptionsLength: finalOptions?.length || 0,
      dynamicPlaceholder,
    },
    'SelectBlockRefactored',
    componentTraceId,
  );

  // 渲染Select组件
  logger.debug(
    'SelectBlock',
    '开始渲染Select组件',
    {
      finalOptionsLength: finalOptions?.length || 0,
      loading,
      dynamicPlaceholder,
      allowPasteMultiple,
    },
    'SelectBlockRefactored',
    componentTraceId,
  );

  const selectElement = (
    <Select
      arrowIcon={<IconDown />}
      placeholder={dynamicPlaceholder}
      maxTagCount={1}
      allowClear
      loading={loading}
      showSearch
      {...selectProps}
      onChange={wrappedOnChange}
      style={propsStyle}
      options={finalOptions}
      onSearch={onSearch}
      onPopupScroll={popupScrollHandler}
      filterOption={filterOption}
      defaultValue={finalDefaultValue as any}
      value={finalValue as any}
      onVisibleChange={handleVisibleChange}
      onClear={handleClear}
      onPaste={allowPasteMultiple ? handlePaste : undefined}
    />
  );

  logger.debug(
    'SelectBlock',
    'Select组件创建完成',
    {
      hasSelectElement: Boolean(selectElement),
    },
    'SelectBlockRefactored',
    componentTraceId,
  );

  // 如果有内联后缀DOM，则包装在容器中
  if (inlineSuffixDom) {
    logger.debug(
      'SelectBlock',
      '渲染带内联后缀的包装器',
      {
        hasInlineSuffixDom: Boolean(inlineSuffixDom),
        hasWrapperStyle: Boolean(wrapperStyle),
      },
      'SelectBlockRefactored',
      componentTraceId,
    );

    const inlineWrapperStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      ...wrapperStyle,
    };

    const wrappedElement = (
      <div style={inlineWrapperStyle} className="select-block-inline-wrapper">
        {selectElement}
        {inlineSuffixDom}
      </div>
    );

    logger.info(
      'SelectBlock',
      '组件渲染完成 (带内联后缀)',
      {
        renderType: 'wrapped',
        hasInlineSuffixDom: true,
      },
      'SelectBlockRefactored',
      componentTraceId,
    );

    return wrappedElement;
  }

  logger.info(
    'SelectBlock',
    '组件渲染完成 (标准模式)',
    {
      renderType: 'standard',
      hasInlineSuffixDom: false,
    },
    'SelectBlockRefactored',
    componentTraceId,
  );

  return selectElement;
};

// 🔧 使用 React.memo 优化性能，自定义比较函数
const SelectBlockRefactored = React.memo(
  SelectBlockRefactoredInner,
  (prevProps, nextProps) => {
    // 🔧 重点：比较 dependency 数组
    const prevDependency = JSON.stringify(prevProps.dependency);
    const nextDependency = JSON.stringify(nextProps.dependency);
    if (prevDependency !== nextDependency) {
      logger.info(
        'SelectBlock',
        '🔄 dependency 变化 - 触发重新渲染',
        {
          prevDependency,
          nextDependency,
          id: nextProps.id,
        },
        'React.memo',
      );
      return false; // dependency 变化，需要重新渲染
    }

    // 🔧 重点：比较 dataSource 对象
    const prevDataSource = prevProps.dataSource;
    const nextDataSource = nextProps.dataSource;
    if (prevDataSource !== nextDataSource) {
      const prevApi =
        prevDataSource && typeof prevDataSource === 'object'
          ? (prevDataSource as any).api
          : undefined;
      const nextApi =
        nextDataSource && typeof nextDataSource === 'object'
          ? (nextDataSource as any).api
          : undefined;
      logger.info(
        'SelectBlock',
        '🔄 dataSource 变化 - 触发重新渲染',
        {
          prevApi,
          nextApi,
          id: nextProps.id,
        },
        'React.memo',
      );
      return false; // dataSource 变化，需要重新渲染
    }

    // 🔥 修复：正确处理 options 从 undefined/[] 到有值的情况
    const prevHasOptions = prevProps.options && prevProps.options.length > 0;
    const nextHasOptions = nextProps.options && nextProps.options.length > 0;

    // 如果 options 状态发生变化（从无到有，或从有到无）
    if (prevHasOptions !== nextHasOptions) {
      logger.info(
        'SelectBlock',
        '🔄 options 状态变化 - 触发重新渲染',
        {
          prevHasOptions,
          nextHasOptions,
          prevOptionsLength: prevProps.options?.length || 0,
          nextOptionsLength: nextProps.options?.length || 0,
          id: nextProps.id,
        },
        'React.memo',
      );
      return false;
    }

    // 如果都有 options，比较内容
    if (prevHasOptions && nextHasOptions) {
      if (prevProps.options.length !== nextProps.options.length) {
        logger.info(
          'SelectBlock',
          '🔄 options 长度变化 - 触发重新渲染',
          {
            prevLength: prevProps.options.length,
            nextLength: nextProps.options.length,
            id: nextProps.id,
          },
          'React.memo',
        );
        return false;
      }
      // 简单比较，不做深度比较
      const optionsChanged =
        JSON.stringify(prevProps.options) !== JSON.stringify(nextProps.options);
      if (optionsChanged) {
        logger.info(
          'SelectBlock',
          '🔄 options 内容变化 - 触发重新渲染',
          {
            id: nextProps.id,
          },
          'React.memo',
        );
        return false;
      }
    }

    // 比较关键 props
    const keysToCompare: (keyof veArchSelectBlockProps)[] = [
      'value',
      'mode',
      'placeholder',
      'disabled',
      'loading',
      'visible',
      'allowClear',
      'showSearch',
      'canFetch', // 🔧 添加 canFetch 比较
    ];

    for (const key of keysToCompare) {
      if (prevProps[key] !== nextProps[key]) {
        logger.debug(
          'SelectBlock',
          `🔄 ${key} 变化 - 触发重新渲染`,
          {
            prevValue: prevProps[key],
            nextValue: nextProps[key],
            id: nextProps.id,
          },
          'React.memo',
        );
        return false;
      }
    }

    // 其他 props 相同，不重新渲染
    logger.debug(
      'SelectBlock',
      '✋ Props 未变化 - 跳过重新渲染',
      {
        id: nextProps.id,
        prevOptionsLength: prevProps.options?.length || 0,
        nextOptionsLength: nextProps.options?.length || 0,
      },
      'React.memo',
    );
    return true;
  },
);

// 为了向后兼容，导出重构后的组件作为默认组件
export { SelectBlockRefactored as SelectBlock };
