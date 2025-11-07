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
 * 缓存管理器
 * 提供内存缓存、本地存储缓存和会话缓存功能
 */

interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  /** 缓存生存时间（毫秒），默认 5 分钟 */
  ttl?: number;
  /** 最大缓存项数量，默认 100 */
  maxSize?: number;
  /** 是否使用 LRU 淘汰策略，默认 true */
  useLRU?: boolean;
  /** 存储类型 */
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

class CacheManager<T = any> {
  private cache: Map<string, CacheItem<T>> = new Map<string, CacheItem<T>>();
  private readonly options: Required<CacheOptions>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 5 * 60 * 1000, // 5分钟
      maxSize: options.maxSize ?? 100,
      useLRU: options.useLRU ?? true,
      storage: options.storage ?? 'memory',
    };

    // 启动定期清理
    this.startCleanup();
  }

  /**
   * 设置缓存项
   */
  set({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: T;
    ttl?: number;
  }): void {
    const now = Date.now();
    const itemTtl = ttl ?? this.options.ttl;

    const item: CacheItem<T> = {
      value,
      timestamp: now,
      ttl: itemTtl,
      accessCount: 0,
      lastAccessed: now,
    };

    // 如果使用浏览器存储
    if (this.options.storage !== 'memory') {
      this.setStorageItem(key, item);
      return;
    }

    // 内存缓存
    this.cache.set(key, item);

    // 检查缓存大小限制
    if (this.cache.size > this.options.maxSize) {
      this.evictItems();
    }
  }

  /**
   * 获取缓存项
   */
  get(key: string): T | null {
    let item: CacheItem<T> | null = null;

    // 从不同存储获取
    if (this.options.storage === 'memory') {
      item = this.cache.get(key) || null;
    } else {
      item = this.getStorageItem(key);
    }

    if (!item) {
      return null;
    }

    const now = Date.now();

    // 检查是否过期
    if (now - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    // 更新访问信息
    item.accessCount++;
    item.lastAccessed = now;

    // 更新存储
    if (this.options.storage === 'memory') {
      this.cache.set(key, item);
    } else {
      this.setStorageItem(key, item);
    }

    return item.value;
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    if (this.options.storage === 'memory') {
      return this.cache.delete(key);
    } else {
      return this.deleteStorageItem(key);
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    if (this.options.storage === 'memory') {
      this.cache.clear();
    } else {
      this.clearStorage();
    }
  }

  /**
   * 检查缓存项是否存在且未过期
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const items = this.getAllItems();
    const now = Date.now();

    let totalSize = 0;
    let expiredCount = 0;
    let hitCount = 0;

    items.forEach((item) => {
      totalSize++;
      if (now - item.timestamp > item.ttl) {
        expiredCount++;
      }
      hitCount += item.accessCount;
    });

    return {
      totalItems: totalSize,
      expiredItems: expiredCount,
      totalHits: hitCount,
      storageType: this.options.storage,
      maxSize: this.options.maxSize,
      defaultTTL: this.options.ttl,
    };
  }

  /**
   * 清理过期项
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    if (this.options.storage === 'memory') {
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }
    } else {
      // 浏览器存储的清理
      const keys = this.getStorageKeys();
      keys.forEach((key) => {
        const item = this.getStorageItem(key);
        if (item && now - item.timestamp > item.ttl) {
          this.deleteStorageItem(key);
          cleanedCount++;
        }
      });
    }

    return cleanedCount;
  }

  /**
   * 淘汰缓存项（LRU策略）
   */
  private evictItems(): void {
    if (!this.options.useLRU) {
      return;
    }

    const items = Array.from(this.cache.entries());

    // 按最后访问时间排序，最久未访问的在前
    items.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // 删除最久未访问的项，直到缓存大小符合限制
    const itemsToRemove = items.length - this.options.maxSize + 1;
    for (let i = 0; i < itemsToRemove; i++) {
      const [key] = items[i];
      this.cache.delete(key);
    }
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    // 每5分钟清理一次过期项
    this.cleanupTimer = setInterval(
      () => {
        const cleaned = this.cleanup();
        if (cleaned > 0) {
          // 清理了过期缓存项，可以在这里添加日志记录
        }
      },
      5 * 60 * 1000,
    );
  }

  /**
   * 停止定期清理
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * 浏览器存储相关方法
   */
  private getStorage() {
    if (typeof window === 'undefined') {
      return null;
    }
    return this.options.storage === 'localStorage'
      ? localStorage
      : sessionStorage;
  }

  private getStorageKey(key: string): string {
    return `cache_${key}`;
  }

  private setStorageItem(key: string, item: CacheItem<T>): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(this.getStorageKey(key), JSON.stringify(item));
    } catch (error) {
      // localStorage/sessionStorage 写入失败（可能是存储空间不足或权限问题），静默处理
    }
  }

  private getStorageItem(key: string): CacheItem<T> | null {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }

    try {
      const data = storage.getItem(this.getStorageKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // localStorage/sessionStorage 读取或解析失败，返回 null（静默处理）
      return null;
    }
  }

  private deleteStorageItem(key: string): boolean {
    const storage = this.getStorage();
    if (!storage) {
      return false;
    }

    try {
      storage.removeItem(this.getStorageKey(key));
      return true;
    } catch (error) {
      // localStorage/sessionStorage 删除失败，返回 false（静默处理）
      return false;
    }
  }

  private clearStorage(): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    const keys = this.getStorageKeys();
    keys.forEach((key) => {
      storage.removeItem(this.getStorageKey(key));
    });
  }

  private getStorageKeys(): string[] {
    const storage = this.getStorage();
    if (!storage) {
      return [];
    }

    const keys: string[] = [];
    const prefix = 'cache_';

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) {
        keys.push(key.substring(prefix.length));
      }
    }

    return keys;
  }

  private getAllItems(): CacheItem<T>[] {
    if (this.options.storage === 'memory') {
      return Array.from(this.cache.values());
    } else {
      const keys = this.getStorageKeys();
      return keys
        .map((key) => this.getStorageItem(key))
        .filter(Boolean) as CacheItem<T>[];
    }
  }
}

// 创建默认缓存实例
export const memoryCache = new CacheManager({ storage: 'memory' });
export const localCache = new CacheManager({
  storage: 'sessionStorage',
  ttl: 24 * 60 * 60 * 1000,
}); // 24小时
export const sessionCache = new CacheManager({ storage: 'sessionStorage' });

// 导出缓存管理器类
export { CacheManager };

/**
 * 缓存装饰器，用于缓存函数结果
 */
export interface CachedParams<T extends (...args: any[]) => any> {
  cacheManager?: CacheManager;
  keyGenerator?: (...args: Parameters<T>) => string;
  ttl?: number;
}

export function cached<T extends (...args: any[]) => any>({
  cacheManager = memoryCache,
  keyGenerator,
  ttl,
}: CachedParams<T> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: Parameters<T>) {
      const cacheKey = keyGenerator
        ? keyGenerator(...args)
        : `${propertyKey}_${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法并缓存结果
      const result = originalMethod.apply(this, args);
      cacheManager.set({ key: cacheKey, value: result, ttl });

      return result;
    };

    return descriptor;
  };
}
