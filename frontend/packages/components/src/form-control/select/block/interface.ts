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

import type { SelectProps } from '@arco-design/web-react';
import type React from 'react';
import type { ReactNode } from 'react';

// 定义多搜索字段配置类型
export type SearchKeyConfig =
  | {
      key: string;
      valueType?: 'string' | 'number';
    }
  | string;

export type Option<T = Record<string, any>> = {
  label: ReactNode;
  value: string | number;
  disabled?: boolean | undefined;
  extra?: T;
};

export interface OptionsEntity {
  options: Array<Option>;
}

export interface StandardEnum {
  type: string;
  code: string;
  name: string;
  extend: string;
  label?: string;
  category?: string;
  value?: string;
}

/**
 * optionfy入参类型
 */
export type OptionfyProps<T> = {
  dataSet: Array<T>;
  labelKey?: string;
  valueKey?: string;
  countKey?: string;
  countKeyUnit?: string;
  isStringItem?: boolean;
  isJoin?: boolean;
  labelRender?: ({ record, _label }: { record: T; _label: any }) => any;
  valueRender?: ({ record, value }: { record: T; value: any }) => any;
  disabledList?: Array<string | number>;
  disabledCheckFunc?: (value: any) => boolean;
  filters?: Partial<T>; // 根据某个key进行条件过滤
};

export type SelectOption = {
  label: ReactNode | string;
  value: string | number;
  disabled?: boolean;
  extra?: any;
};

export type SelectDataSourceProps = {
  search?: any;
  remoteSearchParams?: any;
  pageReq?: {
    skip: number;
    limit: number;
  };
  value?: any;
};

export interface EnumOptionConfigs {
  key: string;
  enumCacheKey?: string;
  filterCode?: string;
  isStringItem?: boolean;
  labelRender?: ({
    record,
    _label,
  }: { record: Record<string, any>; _label: any }) => any;
  disabledList?: Array<string | number>;
  isValueToNumber?: boolean;
  isValueToBoolean?: boolean;
  disabledCheckFunc?: (value: any) => boolean;
}

/**
 * @title 数据源配置
 */
export type DataSourceSetter = {
  serviceInstance: any;
  api: string;
  payload?: any;
  responseEntityKey: string;
  isJsonParse?: boolean;
  JsonParseEntityKey?: string;
  optionCfg: Partial<OptionfyProps<any>>;
};

/**
 * @title API 选择框
 */
export type FinalSelectBlockProps = {
  /**
   * @zh 是否可见
   */
  visible?: boolean;
  /**
   * @zh 异步函数
   * @defaultValue () => []
   */
  dataSource?:
    | ((props: SelectDataSourceProps) => Promise<any> | any)
    | DataSourceSetter;
  /**
   * 缓存key
   */
  cacheKey?: string;
  /**
   * 数据源共享
   */
  dataSourceShare?: boolean;
  /**
   * 是否作为数据源的生产者
   */
  isFirstHint?: boolean;
  /**
   * 滚动分页模式
   */
  isScrollFetching?: boolean;
  /**
   * debouncedFetch
   */
  isDebouncedFetch?: boolean;
  /**
   * 虚拟滚动请求分页
   */
  pageReq: any;
  /**
   * 依赖参数
   */
  dependency?: unknown;
  /**
   * 填充默认值，默认选择option第一个
   */
  defaultActiveFirstOption?: boolean;
  /**
   * options变更的回调
   * @param Options
   */
  onOptionsChange?: (Options: Array<SelectOption>) => void;
  /**
   * 是否在分页场景下支持根据value查询option
   */
  isCascadeRemoteSearch?: boolean;
  /**
   * 分页场景下支持根据value查询option的key
   */
  remoteSearchKey?: string;
  /**
   * 查询search key
   */
  searchKey?: string;
  /**
   * 多字段搜索配置，支持同时搜索多个字段
   * 例如: [{ key: 'fatalId', valueType: 'number' }, { key: 'title', valueType: 'string' }]
   * 或简写为: ['fatalId', 'title']
   */
  multiSearchKeys?: SearchKeyConfig[];
  /**
   * remoteSearchKey format函数
   */
  formatRemoteSearchKey?: (v: string) => any;
  /**
   * 是否再value为空的时候触发options获取
   */
  isValueEmptyTriggerOptions?: boolean;
  /**
   * 前端枚举值配置
   */
  enumOptionConfig: EnumOptionConfigs;
  /**
   * 是否满足请求条件
   */
  canFetch?: boolean;
  /**
   * options处理方法
   * @param props
   */
  handleOptions?: (props: { options: Option[]; value: any }) => Option[];
  /**
   * payload处理方法
   * @param props
   */
  handleParams?: (params: any) => any;
  /**
   * 自定义搜索方法
   * @param props
   */
  _onSearch?: (props: { search: string | null }) => void;
  /**
   * 自定义inlineDom
   */
  inlineSuffixDom?: ReactNode;
  /**
   * @zh 包裹层样式
   * @en Wrapper style
   */
  wrapperStyle?: React.CSSProperties;
};

export type VeArchSelectBlockProps = Partial<FinalSelectBlockProps> &
  SelectProps;
