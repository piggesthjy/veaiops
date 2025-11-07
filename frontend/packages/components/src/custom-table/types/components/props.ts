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
 * CustomTable 组件属性类型定义
 */
import type { FeatureFlags } from '@/custom-table/constants/features';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/pagination';
import type { PluginContext, TableDataSource } from '@veaiops/types';
import type { CSSProperties, ReactNode } from 'react';
import type {
  BaseQuery,
  BaseRecord,
  ExtendedTableProps,
  FeatureConfig,
  HandleFilterProps,
  ModernTableColumnProps,
  QueryFormat,
  ServiceRequestType,
} from '../core/common';
// 使用相对路径避免跨层级导入（遵循 .cursorrules 规范）
import type { LifecyclePhase } from '../hooks/lifecycle';
import type { CustomTableLifecycleConfig } from '../plugins/lifecycle';
import type { QuerySyncConfig } from '../plugins/query-sync';

import type { FieldItem } from '@/filters/core/types';
import type { SearchConfig } from '../plugins/table-toolbar';
// SearchConfig 已移动到 plugins/table-toolbar.ts，此处删除重复定义
// 重新导入使用

/**
 * CustomTable 基础属性接口
 */
export interface CustomTableProps<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
  ServiceType extends ServiceRequestType = ServiceRequestType,
  FormatRecordType extends BaseRecord = RecordType,
> {
  // 基础表格配置
  /** 行唯一标识符 */
  rowKey?: string | ((record: RecordType) => string);
  /** 表格基础列配置 */
  baseColumns?: ModernTableColumnProps<FormatRecordType>[];
  /** 表格额外属性 */
  tableProps?:
    | ExtendedTableProps<FormatRecordType>
    | ((ctx: { loading: boolean }) => ExtendedTableProps<FormatRecordType>);
  /** 表格样式类名 */
  tableClassName?: string;
  /** 表格样式 */
  tableStyle?: CSSProperties;
  /** Sticky 配置 - 控制表头和过滤器的固定行为 */
  stickyConfig?: {
    /** 是否启用表头固定，默认 true */
    enableHeaderSticky?: boolean;
    /** 是否启用过滤器固定，默认 true */
    enableFiltersSticky?: boolean;
    /** 表头 sticky 时距离顶部的距离，默认 0 */
    headerTopOffset?: number;
    /** 过滤器 sticky 时距离顶部的距离，默认 0 */
    filtersTopOffset?: number;
    /** 表头 z-index 值，默认 100 */
    headerZIndex?: number;
    /** 过滤器 z-index 值，默认 99 */
    filtersZIndex?: number;
  };
  /** 自动计算 scroll.y 配置 - 默认启用 */
  autoScrollY?: {
    /** 是否启用自动计算，默认 true */
    enabled?: boolean;
    /** 固定高度偏移量（像素），默认 350 */
    offset?: number;
    /** 最小高度（像素），默认 300 */
    minHeight?: number;
    /** 最大高度（像素），默认 undefined */
    maxHeight?: number;
  };

  // 数据源配置
  /** 数据源配置 */
  dataSource?: TableDataSource<RecordType, Record<string, unknown>>;

  // 分页配置
  /** 分页配置 */
  pagination?: PaginationProps | boolean;

  // 标题配置
  /** 表格标题 */
  title?: string;
  /** 标题样式类名 */
  titleClassName?: string;
  /** 标题样式 */
  titleStyle?: CSSProperties;
  /** 标题操作按钮 */
  actions?: ReactNode[];
  /** 操作按钮样式类名 */
  actionClassName?: string;

  // 过滤器配置
  /** 过滤器属性 */
  tableFilterProps?: Record<string, unknown>;
  /** 是否显示过滤器 */
  isFilterShow?: boolean;
  /** 过滤器是否固定 */
  isFilterAffixed?: boolean;
  /** 过滤器是否收集 */
  isFilterCollection?: boolean;
  /** 过滤器样式配置 */
  filterStyleCfg?: { isWithBackgroundAndBorder: boolean };
  /** 过滤器包装器样式类名 */
  tableFilterWrapperClassName?: string;
  /** 自定义操作样式 */
  customActionsStyle?: CSSProperties;
  /** 启用自定义字段入口（兼容 legacy） */
  enableCustomFields?: boolean;
  /** 自定义字段配置（兼容 legacy） */
  customFieldsProps?: {
    disabledFields: Map<string, string | undefined>;
    value?: string[];
    initialFields?: string[];
    confirm: (value: string[]) => void;
  };
  /** 启用过滤器设置功能 */
  enableFilterSetting?: boolean;
  /** 过滤器设置配置 */
  filterSettingProps?: {
    fixedOptions?: string[];
    allOptions?: string[];
    selectedOptions?: string[];
    hiddenOptions?: string[];
    title?: string;
    mode?: Array<'select' | 'fixed'>;
    caseSelectText?: (key: string) => string;
    saveFun?: (props: {
      fixed_fields: string[];
      selected_fields: string[];
      hidden_fields: string[];
    }) => void;
    onChange?: (props: {
      fixed_fields: string[];
      hidden_fields?: string[];
    }) => void;
  };
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 操作按钮 */
  operations?: ReactNode[];
  /** 自定义操作按钮 */
  customActions?: ReactNode[] | ReactNode;

  // 警告配置
  /** 是否显示警告 */
  isAlertShow?: boolean;
  /** 警告类型 */
  alertType?: 'info' | 'success' | 'warning' | 'error';
  /** 警告内容 */
  alertContent?: ReactNode;
  /** 自定义警告节点 */
  customAlertNode?: ReactNode;

  // 加载配置
  /** 是否使用自定义加载 */
  useCustomLoading?: boolean;
  /** 加载提示文字 */
  loadingTip?: string;
  /** 自定义加载状态 */
  customLoading?: boolean;

  // 空数据配置
  /** 没有数据时显示的元素 */
  noDataElement?: ReactNode;

  // 查询配置
  /** 初始查询参数 */
  initQuery?: QueryType;
  /** 初始过滤器 */
  initFilters?: Record<string, unknown>;
  /** 查询格式配置 */
  queryFormat?: QueryFormat;
  /** 查询转搜索格式函数 */
  queryToSearchFormat?: (query: QueryType) => string;

  // 处理函数
  /** 处理列配置函数 */
  handleColumns?: (
    props: Record<string, unknown>,
  ) => ModernTableColumnProps<FormatRecordType>[];
  /** 处理过滤器函数（返回 FieldItem[] 类型） */
  handleFilters?: (props: HandleFilterProps<QueryType>) => FieldItem[];
  /** 处理列配置属性 */
  handleColumnsProps?: Record<string, unknown>;
  /** 处理过滤器属性 */
  handleFiltersProps?: Record<string, unknown>;

  // 排序配置
  /** 排序字段映射 */
  sortFieldMap?: Record<string, string>;
  /** 是否支持多列排序（兼容 legacy 的 supportSortColumns） */
  supportSortColumns?: boolean;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;

  // 缓存配置
  /** 分页是否缓存 */
  isPaginationInCache?: boolean;

  // 查询参数同步配置
  /** 是否同步查询到搜索参数 */
  syncQueryOnSearchParams?: boolean;
  /** 权限相关的查询前缀配置，用于过滤敏感参数 */
  authQueryPrefixOnSearchParams?: Record<string, string | undefined>;
  /** 查询参数转搜索参数的格式化配置 */
  querySearchParamsFormat?: Record<string, (value: unknown) => string>;
  /** 是否使用 activeKey Hook */
  useActiveKeyHook?: boolean;
  /** 自定义重置逻辑 */
  customReset?: (params: {
    resetEmptyData: boolean;
    setQuery: (query: QueryType) => void;
  }) => void;

  // 过滤器相关
  /** 过滤器是否有效 */
  isFilterEffective?: boolean;
  /** 过滤器重置键 */
  filterResetKeys?: string[];

  // 自定义渲染
  /** 自定义组件渲染 */
  customComponentRender?: (props: { table: ReactNode }) => ReactNode;
  /** 自定义底部 */
  customFooter?:
    | ReactNode
    | ((props: {
        hasMoreData: boolean;
        needContinue?: boolean;
        onLoadMore: () => void;
      }) => ReactNode);
  /** 自定义渲染配置 */
  customRender?: {
    table?: (table: ReactNode) => ReactNode;
    footer?: (props: {
      hasMoreData: boolean;
      needContinue?: boolean;
      onLoadMore: () => void;
    }) => ReactNode;
    [key: string]: unknown;
  };

  // 事件回调
  /** 查询变化回调 */
  onQueryChange?: (query: QueryType) => void;
  /** 加载状态变化回调 */
  onLoadingChange?: (loading: boolean) => void;

  // 功能开关
  /** 功能配置 */
  features?: Partial<FeatureFlags>;
  /** 插件配置 */
  plugins?: string[];
}

/**
 * 过滤器配置项类型
 */
export interface FilterConfigItem {
  type: 'input' | 'select' | 'dateRange' | 'number' | 'cascader';
  key: string;
  label: string;
  placeholder?: string;
  value?: unknown;
  onChange: (value: unknown) => void;
  options?: Array<{ label: string; value: unknown }>;
  multiple?: boolean;
  [key: string]: unknown;
}

// FeatureFlags类型从constants中导入

/**
 * 表格配置化属性
 */
export interface TableConfigProps<
  RecordType extends BaseRecord = BaseRecord,
  ServiceType extends ServiceRequestType = ServiceRequestType,
  FormatRecordType extends BaseRecord = RecordType,
> {
  /** 标题配置 */
  titleConfig?: TitleConfig;
  /** 搜索配置 */
  searchConfig?: SearchConfig;
  /** 工具栏配置 */
  toolbarConfig?: ToolbarConfig;
  /** 过滤器配置 */
  filterConfig?: FilterConfig;
  /** 提示信息配置 */
  alertConfig?: AlertConfig;
  /** 加载状态配置 */
  loadingConfig?: LoadingConfig;
  /** 分页配置 */
  paginationConfig?: PaginationConfig;
  /** 底部配置 */
  footerConfig?: FooterConfig;
  /** 表格配置 */
  tableConfig?: TableConfig<FormatRecordType>;
  /** 数据源配置 */
  dataSourceConfig?: DataSourceConfig<
    ServiceType,
    RecordType,
    Record<string, unknown>,
    FormatRecordType
  >;
  /** 功能开关配置 */
  featureConfig?: FeatureConfig;
  /** 查询参数同步配置 */
  querySyncConfig?: QuerySyncConfig;

  // ========== 生命周期配置 ==========
  /** 插件生命周期配置 */
  lifecycleConfig?: CustomTableLifecycleConfig;

  /** 组件挂载前的回调 */
  onBeforeMount?: (context: PluginContext) => void | Promise<void>;

  /** 组件挂载后的回调 */
  onAfterMount?: (context: PluginContext) => void | Promise<void>;

  /** 组件更新前的回调 */
  onBeforeUpdate?: (context: PluginContext) => void | Promise<void>;

  /** 组件更新后的回调 */
  onAfterUpdate?: (context: PluginContext) => void | Promise<void>;

  /** 组件卸载前的回调 */
  onBeforeUnmount?: (context: PluginContext) => void | Promise<void>;

  /** 插件卸载时的回调 */
  onUninstall?: (context: PluginContext) => void | Promise<void>;

  /** 生命周期执行错误处理 */
  onLifecycleError?: (
    error: Error,
    phase: LifecyclePhase,
    pluginName: string,
  ) => void;
}

/**
 * 标题配置
 */
export interface TitleConfig {
  title?: string;
  className?: string;
  style?: CSSProperties;
  actions?: ReactNode[];
}

/**
 * 工具栏配置
 */
export interface ToolbarConfig {
  operations?: ReactNode[];
  customActions?: ReactNode[];
  style?: CSSProperties;
}

/**
 * 过滤器配置
 */
export interface FilterConfig {
  isFilterShow?: boolean;
  isFilterAffixed?: boolean;
  isFilterCollection?: boolean;
  filterStyleCfg?: { isWithBackgroundAndBorder: boolean };
  tableFilterWrapperClassName?: string;
  customActionsStyle?: CSSProperties;
  showReset?: boolean;
  operations?: ReactNode[];
  tableFilterProps?: Record<string, unknown>;
}

/**
 * 警告配置
 */
export interface AlertConfig {
  isAlertShow?: boolean;
  alertType?: 'info' | 'success' | 'warning' | 'error';
  alertContent?: ReactNode;
  customAlertNode?: ReactNode;
}

/**
 * 加载配置
 */
export interface LoadingConfig {
  useCustomLoading?: boolean;
  loadingTip?: string;
  customLoading?: boolean;
}

/**
 * 分页配置
 */
export interface PaginationConfig extends PaginationProps {
  position?: 'top' | 'bottom' | 'both';
}

/**
 * 底部配置
 */
export interface FooterConfig {
  customFooter?: ReactNode | ((props: Record<string, unknown>) => ReactNode);
  showLoadMore?: boolean;
  loadMoreText?: string;
}

/**
 * 表格配置
 */
export interface TableConfig<RecordType extends BaseRecord = BaseRecord> {
  rowKey?: string | ((record: RecordType) => string);
  tableClassName?: string;
  tableStyle?: CSSProperties;
  tableProps?: ExtendedTableProps<RecordType>;
}

/**
 * 数据源配置
 */
export interface ComponentDataSourceConfig<
  ServiceType extends ServiceRequestType = ServiceRequestType,
  RecordType extends BaseRecord = BaseRecord,
  QueryParams extends Record<string, unknown> = Record<string, unknown>,
  FormatRecordType extends BaseRecord = RecordType,
> extends Partial<TableDataSource<RecordType, QueryParams>> {
  /** 是否启用 */
  enabled?: boolean;
}

// 保持向后兼容性
export type DataSourceConfig<
  ServiceType extends ServiceRequestType = ServiceRequestType,
  RecordType extends BaseRecord = BaseRecord,
  QueryParams extends Record<string, unknown> = Record<string, unknown>,
  FormatRecordType extends BaseRecord = RecordType,
> = ComponentDataSourceConfig<
  ServiceType,
  RecordType,
  QueryParams,
  FormatRecordType
>;

/**
 * 功能配置
 */
/**
 * FeatureConfig 已在 core/common.ts 中定义，此处移除避免重复
 * 如需使用，请从 '@/custom-table/types/core' 或 '@/custom-table/types' 导入
 */

// QuerySyncConfig 已移动到 plugins/query-sync.ts，此处移除导出避免重复
// 如需使用，请从 '@/custom-table/types/plugins' 或 '@/custom-table/types' 导入
