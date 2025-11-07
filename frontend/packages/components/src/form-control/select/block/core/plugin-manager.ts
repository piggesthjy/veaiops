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

import { sessionStore } from '../cache-store';
import { logger } from '../logger';
import type { veArchSelectBlockProps } from '../types/interface';
import type {
  Plugin,
  PluginContext,
  PluginManager,
  PluginUtils,
  SelectBlockState,
} from '../types/plugin';
import { ensureArray, removeUndefinedValues, splitPastedText } from '../util';

// 🔧 状态订阅者类型定义
type StateSubscriber = (newState: SelectBlockState) => void;

/**
 * 插件管理器实现
 */
export class SelectBlockPluginManager implements PluginManager {
  plugins: Map<string, Plugin> = new Map();

  context: PluginContext;

  private managerTraceId: string;

  // 🔧 状态订阅者列表
  private stateSubscribers: StateSubscriber[] = [];

  constructor() {
    this.managerTraceId = logger.generateTraceId();

    logger.info(
      'PluginManager',
      '插件管理器初始化开始',
      {},
      'constructor',
      this.managerTraceId,
    );

    // 初始化插件上下文
    this.context = {
      props: {},
      state: {
        fetchOptions: [],
        initFetchOptions: [],
        fetching: false,
        loading: false,
        skip: 0,
        searchValue: '',
        canTriggerLoadMore: true,
        mounted: false,
      },
      setState: this.setState.bind(this),
      utils: this.createUtils(),
      getPlugin: this.getPlugin.bind(this),
    };

    logger.debug(
      'PluginManager',
      '插件上下文初始化完成',
      {
        initialState: this.context.state,
      },
      'constructor',
      this.managerTraceId,
    );

    logger.info(
      'PluginManager',
      '插件管理器初始化完成',
      {
        contextReady: true,
      },
      'constructor',
      this.managerTraceId,
    );
  }

  /**
   * 创建插件工具函数
   */
  private createUtils(): PluginUtils {
    return {
      ensureArray,
      removeUndefinedValues,
      splitPastedText,
      sessionStore: {
        get: sessionStore.get.bind(sessionStore),
        set: sessionStore.set.bind(sessionStore),
        remove: sessionStore.remove.bind(sessionStore),
      },
    };
  }

  /**
   * 更新状态
   */
  setState(newState: Partial<SelectBlockState>): void {
    const oldState = { ...this.context.state };
    this.context.state = {
      ...this.context.state,
      ...newState,
    };
    // 🔧 立即通知所有订阅者状态变化
    this.notifyStateSubscribers(this.context.state);

    logger.debug(
      'PluginManager',
      '状态更新',
      {
        oldState: {
          ...oldState,
          fetchOptions: `[${oldState.fetchOptions?.length || 0} items]`,
        },
        newState: {
          ...newState,
          fetchOptions: newState.fetchOptions
            ? `[${newState.fetchOptions.length} items]`
            : undefined,
        },
        finalState: {
          ...this.context.state,
          fetchOptions: `[${this.context.state.fetchOptions?.length || 0} items]`,
        },
        subscribersCount: this.stateSubscribers.length,
      },
      'setState',
      this.managerTraceId,
    );
  }

  /**
   * 更新Props
   */
  setProps(props: veArchSelectBlockProps): void {
    logger.debug(
      'PluginManager',
      'Props更新',
      {
        newPropsKeys: Object.keys(props),
        hasDataSource: Boolean(props.dataSource),
        mode: props.mode,
      },
      'setProps',
      this.managerTraceId,
    );

    this.context.props = props;
  }

  /**
   * 注册插件
   */
  register<T extends Plugin>(plugin: T): void {
    if (this.plugins.has(plugin.name)) {
      logger.warn(
        'PluginManager',
        `插件已存在，跳过注册: ${plugin.name}`,
        {
          pluginName: plugin.name,
        },
        'register',
        this.managerTraceId,
      );
      return;
    }

    logger.info(
      'PluginManager',
      `开始注册插件: ${plugin.name}`,
      {
        pluginName: plugin.name,
        hasInit: Boolean(plugin.init),
      },
      'register',
      this.managerTraceId,
    );

    this.plugins.set(plugin.name, plugin);

    // 如果插件有初始化方法，则调用
    if (plugin.init) {
      try {
        plugin.init(this.context);
        logger.info(
          'PluginManager',
          `插件初始化成功: ${plugin.name}`,
          {
            pluginName: plugin.name,
          },
          'register',
          this.managerTraceId,
        );
      } catch (error) {
        logger.error(
          'PluginManager',
          `插件初始化失败: ${plugin.name}`,
          error as Error,
          {
            pluginName: plugin.name,
          },
          'register',
          this.managerTraceId,
        );
      }
    }

    logger.info(
      'PluginManager',
      `插件注册完成: ${plugin.name}`,
      {
        pluginName: plugin.name,
        totalPlugins: this.plugins.size,
      },
      'register',
      this.managerTraceId,
    );
  }

  /**
   * 注销插件
   */
  unregister(pluginName: string): void {
    logger.info(
      'PluginManager',
      `开始注销插件: ${pluginName}`,
      {
        pluginName,
        exists: this.plugins.has(pluginName),
      },
      'unregister',
      this.managerTraceId,
    );

    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      // 调用插件的销毁方法
      if (plugin.destroy) {
        try {
          plugin.destroy();
          logger.info(
            'PluginManager',
            `插件销毁完成: ${pluginName}`,
            {
              pluginName,
            },
            'unregister',
            this.managerTraceId,
          );
        } catch (error) {
          logger.error(
            'PluginManager',
            `插件销毁失败: ${pluginName}`,
            error as Error,
            {
              pluginName,
            },
            'unregister',
            this.managerTraceId,
          );
        }
      }
      this.plugins.delete(pluginName);

      logger.info(
        'PluginManager',
        `插件注销完成: ${pluginName}`,
        {
          pluginName,
          remainingPlugins: this.plugins.size,
        },
        'unregister',
        this.managerTraceId,
      );
    } else {
      logger.warn(
        'PluginManager',
        `插件不存在，无法注销: ${pluginName}`,
        {
          pluginName,
        },
        'unregister',
        this.managerTraceId,
      );
    }
  }

  /**
   * 获取插件
   */
  getPlugin<T extends Plugin>(pluginName: string): T | undefined {
    const plugin = this.plugins.get(pluginName) as T | undefined;
    logger.debug(
      'PluginManager',
      `获取插件: ${pluginName}`,
      {
        pluginName,
        found: Boolean(plugin),
      },
      'getPlugin',
      this.managerTraceId,
    );
    return plugin;
  }

  /**
   * 初始化所有插件
   */
  async init(): Promise<void> {
    logger.info(
      'PluginManager',
      '开始初始化所有插件',
      {
        pluginCount: this.plugins.size,
      },
      'init',
      this.managerTraceId,
    );

    const initPromises = Array.from(this.plugins.values())
      .filter((plugin) => plugin.init)
      .map((plugin) => {
        logger.debug(
          'PluginManager',
          `初始化插件: ${plugin.name}`,
          {
            pluginName: plugin.name,
          },
          'init',
          this.managerTraceId,
        );
        return plugin.init!(this.context);
      });

    try {
      await Promise.all(initPromises);
      logger.info(
        'PluginManager',
        '所有插件初始化完成',
        {
          initializedCount: initPromises.length,
        },
        'init',
        this.managerTraceId,
      );
    } catch (error) {
      logger.error(
        'PluginManager',
        '插件初始化失败',
        error as Error,
        {
          pluginCount: initPromises.length,
        },
        'init',
        this.managerTraceId,
      );
      throw error;
    }
  }

  // 🔧 状态订阅管理方法

  /**
   * 订阅状态变化
   */
  subscribe(subscriber: StateSubscriber): () => void {
    this.stateSubscribers.push(subscriber);

    logger.debug(
      'PluginManager',
      '新增状态订阅者',
      { subscribersCount: this.stateSubscribers.length },
      'subscribe',
      this.managerTraceId,
    );

    // 返回取消订阅函数
    return () => this.unsubscribe(subscriber);
  }

  /**
   * 取消订阅状态变化
   */
  private unsubscribe(subscriber: StateSubscriber): void {
    const index = this.stateSubscribers.indexOf(subscriber);
    if (index > -1) {
      this.stateSubscribers.splice(index, 1);

      logger.debug(
        'PluginManager',
        '移除状态订阅者',
        { subscribersCount: this.stateSubscribers.length },
        'unsubscribe',
        this.managerTraceId,
      );
    }
  }

  /**
   * 通知所有订阅者状态变化
   */
  private notifyStateSubscribers(newState: SelectBlockState): void {
    // 🔧 立即通知所有订阅者，绕过React批量更新
    this.stateSubscribers.forEach((subscriber) => {
      try {
        subscriber(newState);
      } catch (error) {
        logger.error(
          'PluginManager',
          '状态订阅者通知失败',
          error as Error,
          { error: String(error) },
          'notifyStateSubscribers',
          this.managerTraceId,
        );
      }
    });
  }

  /**
   * 销毁所有插件
   */
  destroy(): void {
    logger.info(
      'PluginManager',
      '开始销毁所有插件',
      {
        pluginCount: this.plugins.size,
      },
      'destroy',
      this.managerTraceId,
    );

    this.plugins.forEach((plugin) => {
      if (plugin.destroy) {
        try {
          plugin.destroy();
          logger.debug(
            'PluginManager',
            `插件销毁成功: ${plugin.name}`,
            {
              pluginName: plugin.name,
            },
            'destroy',
            this.managerTraceId,
          );
        } catch (error) {
          logger.error(
            'PluginManager',
            `插件销毁失败: ${plugin.name}`,
            error as Error,
            {
              pluginName: plugin.name,
            },
            'destroy',
            this.managerTraceId,
          );
        }
      }
    });
    this.plugins.clear();

    // 🔧 清理所有状态订阅者
    this.stateSubscribers.length = 0;

    logger.info(
      'PluginManager',
      '所有插件销毁完成',
      {
        remainingPlugins: this.plugins.size,
        remainingSubscribers: this.stateSubscribers.length,
      },
      'destroy',
      this.managerTraceId,
    );
  }

  /**
   * 获取状态
   */
  getState(): SelectBlockState {
    logger.debug(
      'PluginManager',
      '获取状态',
      {
        state: {
          ...this.context.state,
          fetchOptions: `[${this.context.state.fetchOptions?.length || 0} items]`,
        },
      },
      'getState',
      this.managerTraceId,
    );
    return this.context.state;
  }

  /**
   * 获取Props
   */
  getProps(): veArchSelectBlockProps {
    logger.debug(
      'PluginManager',
      '获取Props',
      {
        propsKeys: Object.keys(this.context.props),
      },
      'getProps',
      this.managerTraceId,
    );
    return this.context.props;
  }
}
