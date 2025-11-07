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

import { safeJSONParse } from '@veaiops/utils';
import { delay, isFunction } from 'lodash-es';
import { logger } from '../../logger';
import type {
  DataSourceSetter,
  SelectDataSourceProps,
  SelectOption,
} from '../../types/interface';
import type {
  CacheHandlerPlugin,
  DataFetcherConfig,
  DataFetcherPlugin,
  PluginContext,
} from '../../types/plugin';
import { isDataSourceSetter, optionfy } from '../../util';

/**
 * 数据获取插件实现
 */
export class DataFetcherPluginImpl implements DataFetcherPlugin {
  name = 'data-fetcher';

  config: DataFetcherConfig;

  private context!: PluginContext;

  private cacheHandlerRef?: CacheHandlerPlugin;

  // 🔧 添加销毁标记
  private isDestroyed = false;

  constructor(config: DataFetcherConfig) {
    this.config = config;
  }

  init(context: PluginContext): void {
    this.context = context;
    logger.debug(
      'DataFetcher',
      '插件初始化',
      {
        hasContext: Boolean(context),
      },
      'init',
    );
  }

  setCacheHandler(cacheHandler: CacheHandlerPlugin): void {
    this.cacheHandlerRef = cacheHandler;
  }

  /**
   * 获取当前的 context（带防御性检查）
   */
  private getContext(): PluginContext | null {
    if (this.isDestroyed) {
      logger.warn('DataFetcher', 'plugin is destroyed', {}, 'getContext');
      return null;
    }
    if (!this.context) {
      logger.warn('DataFetcher', 'context is null', {}, 'getContext');
      return null;
    }
    return this.context;
  }

  /**
   * 通过数据设置器获取数据
   * @param dataSource 数据源配置
   * @param remoteSearchParams 搜索参数
   * @param externalContext 可选的外部 context（用于防抖场景）
   */
  async fetchByDataSetter(
    dataSource: DataSourceSetter,
    remoteSearchParams: Record<string, any>,
    externalContext?: PluginContext,
  ): Promise<SelectOption[]> {
    // 优先使用外部传入的 context，其次使用内部 context
    const ctx = externalContext || this.getContext();
    if (!ctx) {
      logger.warn(
        'DataFetcher',
        'fetchByDataSetter called but context is null or destroyed',
        {
          isDestroyed: this.isDestroyed,
          hasExternalContext: Boolean(externalContext),
        },
        'fetchByDataSetter',
      );
      return [];
    }

    const {
      serviceInstance,
      api,
      isJsonParse = false,
      JsonParseEntityKey = '',
      payload = {},
      responseEntityKey,
      optionCfg,
    } = dataSource;

    const { limit, handleParams } = this.config;
    const { state, utils } = ctx; // 🔧 使用传入的 ctx 而不是 this.context
    const { props } = ctx; // 🔧 使用传入的 ctx 而不是 this.context

    let _options: SelectOption[] = [];

    try {
      // 检查payload中是否包含自定义的粘贴值字段（如accountIDs），如果有则不添加额外的value参数
      const hasPasteValueKey =
        props.pasteValueKey && payload[props.pasteValueKey];

      const finalParams = handleParams(
        utils.removeUndefinedValues({
          ...payload,
          ...remoteSearchParams,
          // 只有在没有使用pasteValueKey时才添加value参数
          ...(hasPasteValueKey ? {} : { value: props.value }),
          pageReq: {
            skip: state.skip,
            limit,
          },
        }),
      );

      // 🔧 添加请求开始日志
      logger.info(
        'DataFetcher',
        `开始请求数据: ${api}`,
        {
          api,
          params: finalParams,
          serviceInstance: serviceInstance ? 'exists' : 'missing',
          skip: state.skip,
          limit,
        },
        'fetchByDataSetter',
      );

      const requestStartTime = Date.now();
      const response = await serviceInstance?.[api]?.(finalParams);
      const requestDuration = Date.now() - requestStartTime;

      // 🔧 记录原始响应结构
      const responseStructure = {
        api,
        hasResponse: Boolean(response),
        responseType: typeof response,
        responseKeys:
          response && typeof response === 'object' ? Object.keys(response) : [],

        // 检查 response.result 路径
        hasResult: Boolean(response?.result),
        resultType: typeof response?.result,
        resultKeys: response?.result ? Object.keys(response.result) : [],

        // 检查 response.result[responseEntityKey] 路径
        hasResultEntity: Boolean(response?.result?.[responseEntityKey]),
        resultEntityType: typeof response?.result?.[responseEntityKey],
        resultEntityIsArray: Array.isArray(
          response?.result?.[responseEntityKey],
        ),
        resultEntityLength: Array.isArray(response?.result?.[responseEntityKey])
          ? response.result[responseEntityKey].length
          : 'N/A',

        // 检查 response[responseEntityKey] 路径（直接访问）
        hasDirectEntity: Boolean(response?.[responseEntityKey]),
        directEntityType: typeof response?.[responseEntityKey],
        directEntityIsArray: Array.isArray(response?.[responseEntityKey]),
        directEntityLength: Array.isArray(response?.[responseEntityKey])
          ? response[responseEntityKey].length
          : 'N/A',

        responseEntityKey,
      };

      logger.info(
        'DataFetcher',
        `响应结构分析: ${api}`,
        responseStructure,
        'fetchByDataSetter',
      );

      // 🔧 修复：直接使用 response[responseEntityKey]（即 response.data）
      let ret = response?.[responseEntityKey];

      logger.debug(
        'DataFetcher',
        `数据提取结果: ${api}`,
        {
          api,
          responseEntityKey,
          retType: typeof ret,
          retIsArray: Array.isArray(ret),
          retLength: Array.isArray(ret) ? ret.length : 'N/A',
        },
        'fetchByDataSetter',
      );

      if (isJsonParse) {
        // 支持json解析
        const parsedData = safeJSONParse({ valueString: ret, empty: {} }) as {
          [key: string]: any;
        };
        ret = parsedData?.[JsonParseEntityKey];
      }

      const dataArray = utils.ensureArray(ret);
      _options = optionfy({
        dataSet: dataArray,
        ...optionCfg,
      });

      // 🔧 添加请求成功日志
      logger.info(
        'DataFetcher',
        `请求成功: ${api}`,
        {
          api,
          duration: `${requestDuration}ms`,
          dataCount: dataArray?.length || 0,
          optionsCount: _options?.length || 0,
          responseEntityKey,
          actualDataReceived: dataArray?.length > 0,
        },
        'fetchByDataSetter',
      );

      // 处理数据源共享
      if (props.dataSourceShare && this.cacheHandlerRef) {
        this.cacheHandlerRef.setToCache(api, response);
      }
    } catch (error) {
      // 🔧 添加请求失败日志
      logger.error(
        'DataFetcher',
        `请求失败: ${api}`,
        error as Error,
        {
          api,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'fetchByDataSetter',
      );
      _options = [];
    } finally {
      delay(() => {
        const finalCtx = this.getContext();
        if (finalCtx) {
          finalCtx.setState({
            fetching: false,
            loading: false,
          });
          logger.debug(
            'DataFetcher',
            '延迟重置 loading 状态',
            {
              api,
            },
            'fetchByDataSetter',
          );
        }
      }, 500);
    }

    return _options;
  }

  /**
   * 通过函数获取数据
   * @param dataSource 数据源函数
   * @param remoteSearchParams 搜索参数
   * @param externalContext 可选的外部 context（用于防抖场景）
   */
  async fetchByFunction(
    dataSource: (props: SelectDataSourceProps) => Promise<any> | any,
    remoteSearchParams: any,
    externalContext?: PluginContext,
  ): Promise<SelectOption[]> {
    // 优先使用外部传入的 context
    const ctx = externalContext || this.getContext();
    if (!ctx) {
      logger.warn(
        'DataFetcher',
        'fetchByFunction called but context is null or destroyed',
        {
          isDestroyed: this.isDestroyed,
          hasExternalContext: Boolean(externalContext),
        },
        'fetchByFunction',
      );
      return [];
    }

    const { limit, handleParams } = this.config;
    const { state, utils } = ctx;
    const { props } = ctx;

    try {
      // 检查remoteSearchParams中是否包含自定义的粘贴值字段，如果有则不添加额外的value参数
      const hasPasteValueKey =
        props.pasteValueKey && remoteSearchParams[props.pasteValueKey];

      const finalParams = handleParams(
        utils.removeUndefinedValues({
          ...remoteSearchParams,
          // 只有在没有使用pasteValueKey时才添加value参数
          ...(hasPasteValueKey ? {} : { value: props.value }),
          pageReq: {
            skip: state.skip,
            limit,
          },
        }),
      );

      // 🔧 添加函数请求开始日志
      logger.info(
        'DataFetcher',
        '开始执行数据源函数',
        {
          params: finalParams,
          skip: state.skip,
          limit,
        },
        'fetchByFunction',
      );

      const requestStartTime = Date.now();
      const response = await dataSource?.(finalParams);
      const requestDuration = Date.now() - requestStartTime;

      let _options: SelectOption[] = [];

      // 根据实际情况处理函数类型数据源返回的数据
      if (Array.isArray(response)) {
        _options = response;
      }

      // 🔧 添加函数请求成功日志
      logger.info(
        'DataFetcher',
        '数据源函数执行成功',
        {
          duration: `${requestDuration}ms`,
          optionsCount: _options?.length || 0,
          isArray: Array.isArray(response),
        },
        'fetchByFunction',
      );

      return _options;
    } catch (error) {
      // 🔧 添加函数请求失败日志
      logger.error(
        'DataFetcher',
        '数据源函数执行失败',
        error as Error,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'fetchByFunction',
      );
      return [];
    }
  }

  /**
   * 统一的数据获取方法
   * @param dataSource 数据源配置或函数
   * @param remoteSearchParams 搜索参数
   * @param externalContext 可选的外部 context（用于防抖场景）
   */
  async fetchData(
    dataSource:
      | DataSourceSetter
      | ((props: SelectDataSourceProps) => Promise<any>),
    remoteSearchParams: Record<string, any>,
    externalContext?: PluginContext,
  ): Promise<SelectOption[]> {
    // 优先使用外部传入的 context
    const ctx = externalContext || this.getContext();
    if (!ctx) {
      logger.warn(
        'DataFetcher',
        'fetchData called but context is null or destroyed',
        {
          isDestroyed: this.isDestroyed,
          hasContext: Boolean(this.context),
          hasExternalContext: Boolean(externalContext),
        },
        'fetchData',
      );
      return [];
    }

    // 🔧 详细记录 dataSource 信息
    const dataSourceInfo: any = {
      typeofDataSource: typeof dataSource,
      isObject: typeof dataSource === 'object' && dataSource !== null,
    };

    if (typeof dataSource === 'object' && dataSource !== null) {
      dataSourceInfo.hasServiceInstance = 'serviceInstance' in dataSource;
      dataSourceInfo.hasApi = 'api' in dataSource;
      if ('api' in dataSource) {
        dataSourceInfo.apiValue = (dataSource as any).api;
        dataSourceInfo.apiType = typeof (dataSource as any).api;
        dataSourceInfo.apiIncludesUndefined =
          typeof (dataSource as any).api === 'string' &&
          (dataSource as any).api.includes('undefined');
        dataSourceInfo.apiIncludesNull =
          typeof (dataSource as any).api === 'string' &&
          (dataSource as any).api.includes('null');
      }
      if ('serviceInstance' in dataSource) {
        const { serviceInstance } = dataSource as any;
        dataSourceInfo.serviceInstanceType = typeof serviceInstance;
        if (
          'api' in dataSource &&
          typeof (dataSource as any).api === 'string'
        ) {
          const { api } = dataSource as any;
          dataSourceInfo.apiMethodExists =
            typeof serviceInstance?.[api] === 'function';
        }
      }
    }

    const isValidDataSourceSetter = isDataSourceSetter(dataSource);
    const isValidFunction = isFunction(dataSource);

    // 🔧 添加数据获取入口日志
    logger.info(
      'DataFetcher',
      '数据获取入口',
      {
        dataSourceType: isValidDataSourceSetter
          ? 'DataSourceSetter'
          : isValidFunction
            ? 'Function'
            : 'Invalid',
        isValidDataSourceSetter,
        isValidFunction,
        dataSourceInfo,
        remoteSearchParams,
      },
      'fetchData',
    );

    if (isValidDataSourceSetter) {
      return this.fetchByDataSetter(
        dataSource,
        remoteSearchParams,
        externalContext,
      );
    }
    if (isValidFunction) {
      return this.fetchByFunction(
        dataSource as (props: SelectDataSourceProps) => Promise<any>,
        remoteSearchParams,
        externalContext,
      );
    }

    logger.warn(
      'DataFetcher',
      'dataSource 验证失败，无法获取数据',
      {
        dataSourceType: typeof dataSource,
        dataSourceInfo,
        possibleReasons: [
          'api 包含 undefined 或 null',
          'api 方法不存在于 serviceInstance',
          'serviceInstance 为空',
          'dataSource 配置不完整',
        ],
      },
      'fetchData',
    );

    return [];
  }

  /**
   * 处理获取的选项数据
   * @param options 原始选项数据
   * @param isAppend 是否追加模式
   * @param apiName API 名称
   * @param externalContext 可选的外部 context（用于防抖场景）
   */
  processOptions(
    options: SelectOption[],
    isAppend = false,
    apiName?: string,
    externalContext?: PluginContext,
  ): SelectOption[] {
    // 优先使用外部传入的 context
    const ctx = externalContext || this.getContext();
    if (!ctx) {
      logger.warn(
        'DataFetcher',
        'processOptions called but context is null or destroyed',
        {
          isDestroyed: this.isDestroyed,
          optionsCount: options?.length || 0,
          hasExternalContext: Boolean(externalContext),
        },
        'processOptions',
      );
      return options;
    }

    const { state } = ctx;
    const { handleOptions } = this.config;
    const { props } = ctx;

    // 🔧 添加选项处理日志
    logger.debug(
      'DataFetcher',
      '处理选项数据',
      {
        apiName,
        optionsCount: options?.length || 0,
        isAppend,
        existingOptionsCount: state.fetchOptions?.length || 0,
      },
      'processOptions',
    );

    // 决定是否追加数据 - 使用cloneDeep确保深拷贝，与原始代码保持一致
    const finalOptions = isAppend
      ? this.cloneDeep([...state.fetchOptions, ...options])
      : options;

    // 应用用户自定义的处理函数
    const result = isFunction(handleOptions)
      ? handleOptions({ options: finalOptions, value: props.value })
      : finalOptions;

    logger.debug(
      'DataFetcher',
      '选项处理完成',
      {
        apiName,
        finalOptionsCount: result?.length || 0,
        hasCustomHandler: isFunction(handleOptions),
      },
      'processOptions',
    );

    return result;
  }

  /**
   * 深拷贝函数，确保与原始代码行为一致
   */
  private cloneDeep<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.cloneDeep(item)) as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.cloneDeep(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * 更新分页相关状态
   */
  updatePaginationState(options: SelectOption[]): void {
    const ctx = this.getContext();
    if (!ctx) {
      logger.warn(
        'DataFetcher',
        'updatePaginationState called but context is null or destroyed',
        {
          isDestroyed: this.isDestroyed,
        },
        'updatePaginationState',
      );
      return;
    }

    const { limit } = this.config;

    // 🔧 移除loading重置，由search-handler统一管理loading状态
    ctx.setState({
      canTriggerLoadMore: options?.length >= limit,
    });

    logger.debug(
      'DataFetcher',
      '更新分页状态',
      {
        optionsCount: options?.length || 0,
        limit,
        canTriggerLoadMore: options?.length >= limit,
      },
      'updatePaginationState',
    );
  }

  destroy(): void {
    this.isDestroyed = true;
    logger.debug('DataFetcher', '插件销毁', {}, 'destroy');
    // 清理资源
    this.context = null as any;
  }
}
