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

import { logger } from '../../logger';
import type {
  CacheHandlerConfig,
  CacheHandlerPlugin,
  PluginContext,
} from '../../types/plugin';

/**
 * 缓存处理插件实现
 */
export class CacheHandlerPluginImpl implements CacheHandlerPlugin {
  name = 'cache-handler';

  config: CacheHandlerConfig;

  private context!: PluginContext;

  private removalTimeouts: Map<string, ReturnType<typeof setTimeout>> =
    new Map();

  constructor(config: CacheHandlerConfig) {
    this.config = {
      autoRemoveDelay: 5000,
      ...config,
    };
  }

  init(context: PluginContext): void {
    this.context = context;
    logger.debug(
      'CacheHandler',
      '插件初始化',
      {
        cacheKey: this.config.cacheKey,
        dataSourceShare: this.config.dataSourceShare,
        autoRemoveDelay: this.config.autoRemoveDelay,
      },
      'init',
    );
  }

  /**
   * 从缓存中获取数据
   */
  getFromCache(key: string): any {
    if (!this.context) {
      logger.warn(
        'CacheHandler',
        'getFromCache called but context is null',
        { key },
        'getFromCache',
      );
      return null;
    }
    const data = this.context.utils.sessionStore.get(key);
    logger.debug(
      'CacheHandler',
      '从缓存获取数据',
      {
        key,
        hasData: Boolean(data),
        dataType: typeof data,
      },
      'getFromCache',
    );
    return data;
  }

  /**
   * 设置缓存数据
   */
  setToCache(key: string, data: any): void {
    if (!this.context) {
      logger.warn(
        'CacheHandler',
        'setToCache called but context is null',
        { key },
        'setToCache',
      );
      return;
    }
    this.context.utils.sessionStore.set(key, data);
    logger.debug(
      'CacheHandler',
      '设置缓存数据',
      {
        key,
        dataType: typeof data,
      },
      'setToCache',
    );
  }

  /**
   * 从缓存中移除数据
   */
  removeFromCache(key: string): void {
    this.context.utils.sessionStore.remove(key);

    // 清除定时器
    const timeout = this.removalTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.removalTimeouts.delete(key);
    }
  }

  /**
   * 安排延迟移除缓存
   */
  scheduleRemoval(key: string, delay?: number): void {
    const removeDelay = delay ?? this.config.autoRemoveDelay;

    // 清除之前的定时器
    const existingTimeout = this.removalTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 设置新的定时器
    const timeout = setTimeout(() => {
      this.removeFromCache(key);
    }, removeDelay);

    this.removalTimeouts.set(key, timeout);
  }

  /**
   * 检查缓存中是否存在指定key的数据
   */
  hasCache(key: string): boolean {
    const data = this.getFromCache(key);
    return data !== null && data !== undefined;
  }

  /**
   * 清空所有缓存
   */
  clearAllCache(): void {
    // 清除所有定时器
    this.removalTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.removalTimeouts.clear();
  }

  /**
   * 处理数据源共享的缓存逻辑
   */
  handleDataSourceCache(api: string, response: any): void {
    if (this.config.dataSourceShare) {
      this.setToCache(api, response);
    }
  }

  /**
   * 获取或设置缓存数据
   */
  getOrSetCache<T>(
    key: string,
    factory: () => Promise<T> | T,
    shouldCache = true,
  ): Promise<T> | T {
    // 检查缓存中是否存在数据
    const cachedData = this.getFromCache(key);
    if (cachedData !== null && cachedData !== undefined) {
      // 如果找到缓存数据，安排延迟移除
      this.scheduleRemoval(key);
      return cachedData;
    }

    // 如果缓存中没有数据，调用factory函数获取
    const result = factory();

    if (result instanceof Promise) {
      return result.then((data) => {
        if (shouldCache) {
          this.setToCache(key, data);
        }
        return data;
      });
    }
    if (shouldCache) {
      this.setToCache(key, result);
    }
    return result;
  }

  /**
   * 处理组件卸载或重置时的缓存清理
   */
  handleComponentReset(): void {
    const { cacheKey } = this.config;

    if (cacheKey) {
      // 移除当前组件的缓存
      this.removeFromCache(cacheKey);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { activeTimeouts: number; cacheKey?: string } {
    return {
      activeTimeouts: this.removalTimeouts.size,
      cacheKey: this.config.cacheKey,
    };
  }

  /**
   * 延长缓存生存时间
   */
  extendCacheLifetime(key: string, additionalDelay?: number): void {
    const delay = additionalDelay ?? this.config.autoRemoveDelay;
    this.scheduleRemoval(key, delay);
  }

  /**
   * 立即移除指定缓存
   */
  immediateRemove(key: string): void {
    this.removeFromCache(key);
  }

  destroy(): void {
    // 清除所有定时器
    this.removalTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.removalTimeouts.clear();

    // 清理当前组件相关的缓存
    if (this.config.cacheKey) {
      this.removeFromCache(this.config.cacheKey);
    }

    this.context = null as any;
  }
}
