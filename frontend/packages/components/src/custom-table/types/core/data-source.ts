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
 * CustomTable 数据源相关类型定义
 */
import type {
  BaseQuery,
  BaseRecord,
  FiltersProps,
  FormTableDataProps,
  OnProcessType,
  OnSuccessResponse,
  ServiceRequestType,
} from './common';

/**
 * 表格数据源配置
 */
export interface TableDataSource<
  ServiceType extends ServiceRequestType = ServiceRequestType,
  RecordType extends BaseRecord = BaseRecord,
  QueryParams extends Record<string, unknown> = Record<string, unknown>,
  FormatRecordType extends BaseRecord = RecordType,
> {
  /** 服务实例 */
  serviceInstance?: ServiceType;
  /** 服务方法名 */
  serviceMethod?: keyof ServiceType;
  /** 请求函数 */
  request?: (params: QueryParams) => Promise<unknown>;
  /** 额外的请求参数 */
  payload?: Record<string, unknown>;
  /** 响应数据项的键名 */
  responseItemsKey?: string;
  /** 是否为服务端分页 */
  isServerPagination?: boolean;
  /** 是否为空列过滤 */
  isEmptyColumnsFilter?: boolean;
  /** 是否可以取消请求 */
  isCancel?: boolean;
  /** 是否准备就绪 */
  ready?: boolean;
  /** 是否手动触发 */
  manual?: boolean;
  /** 是否需要继续 */
  needContinue?: boolean;
  /** 是否有更多数据 */
  hasMoreData?: boolean;
  /** 是否滚动获取数据 */
  scrollFetchData?: boolean;
  /** 是否展平数据 */
  flattenData?: boolean;
  /** 静态数据列表 */
  dataList?: RecordType[];
  /** 数组字段 */
  arrayFields?: string[];
  /** 查询搜索键 */
  querySearchKey?: string;
  /** 查询搜索匹配键 */
  querySearchMatchKeys?: string[];
  /** 添加行键函数 */
  addRowKey?: (item: RecordType, index: number) => string | number;
  /** 格式化数据配置 */
  formatDataConfig?: Record<string, (item: RecordType) => unknown>;
  /** 分页转换函数 */
  paginationConvert?: (
    page_req: Record<string, unknown>,
  ) => Record<string, unknown>;
  /** 格式化载荷函数 */
  formatPayload?: (payload: Record<string, unknown>) => Record<string, unknown>;
  /** 插件配置 */
  pluginConfig?: {
    showNotice?: {
      stage: 'success' | 'fail' | 'all';
    };
    title?: string;
    content?: string;
  };
  /** 成功回调 */
  onSuccess?: (
    response: OnSuccessResponse<FormatRecordType, BaseQuery>,
  ) => void;
  /** 错误回调 */
  onError?: (error?: Error) => void;
  /** 完成回调 */
  onFinally?: () => void;
  /** 处理回调 */
  onProcess?: (handler: OnProcessType) => void;
}

/**
 * 数据源状态
 */
export interface DataSourceState<RecordType extends BaseRecord = BaseRecord> {
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 格式化后的数据 */
  data: RecordType[];
  /** 总数 */
  total: number;
  /** 表格总数 */
  tableTotal: number;
  /** 是否有更多数据 */
  hasMoreData: boolean;
}

/**
 * 数据源操作方法
 */
export interface DataSourceActions {
  /** 运行请求 */
  run: () => Promise<void>;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 取消请求 */
  cancel: () => void;
  /** 加载更多数据 */
  loadMoreData?: () => void;
  /** 设置重置空数据 */
  setResetEmptyData?: (reset: boolean) => void;
}

/**
 * 数据源钩子返回类型
 */
export interface DataSourceHookResult<
  RecordType extends BaseRecord = BaseRecord,
> extends DataSourceState<RecordType>,
    DataSourceActions {}

/**
 * 数据源配置选项
 */
export interface DataSourceConfig<
  ServiceType extends ServiceRequestType = ServiceRequestType,
  RecordType extends BaseRecord = BaseRecord,
  FormatRecordType extends BaseRecord = RecordType,
> {
  /** 防抖等待时间 */
  debounceWait?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 缓存键 */
  cacheKey?: string;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存时间 */
  cacheTime?: number;
  /** 默认数据 */
  defaultData?: RecordType[];
  /** 错误重试间隔 */
  errorRetryInterval?: number;
  /** 成功回调 */
  onSuccess?: (data: RecordType[], extra?: Record<string, unknown>) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 数据处理工具类型
 */
export interface DataProcessor<
  RecordType extends BaseRecord = BaseRecord,
  FormatRecordType extends BaseRecord = RecordType,
> {
  /** 格式化表格数据 */
  formatTableData: (
    props: FormTableDataProps<RecordType>,
  ) => FormatRecordType[];
  /** 过滤表格数据 */
  filterTableData: (
    data: FormatRecordType[],
    filters: FiltersProps,
  ) => FormatRecordType[];
  /** 过滤空数据 */
  filterEmptyDataByKeys: (
    data: Record<string, unknown>,
  ) => Record<string, unknown>;
}
