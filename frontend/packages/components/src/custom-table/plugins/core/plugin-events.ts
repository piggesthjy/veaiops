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
 * 插件事件系统模块
 * 负责插件间的事件通信
 *

 * @date 2025-12-19
 */
import { devLog } from '@/custom-table/utils/log-utils';

/**
 * @name 事件监听器类型
 */
export type EventListener = (...args: unknown[]) => void;

/**
 * @name 事件取消函数类型
 */
export type UnsubscribeFunction = () => void;

/**
 * @name 插件事件系统
 */
export class PluginEventSystem {
  private eventListeners: Record<string, EventListener[]> = {};

  /**
   * @name 触发事件
   */
  emit(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners[event] || [];

    listeners.forEach((listener) => {
      try {
        listener(...args);
      } catch (error: unknown) {
        // ✅ 正确：记录错误但不中断其他监听器的执行，透出实际错误信息
        // 事件监听器错误不应中断其他监听器，但仍需记录日志用于调试
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        devLog.warn({
          component: 'PluginEventSystem',
          message: `事件监听器执行失败 (event: "${event}")`,
          data: {
            event,
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
        });
      }
    });
  }

  /**
   * @name 监听事件
   */
  on({
    event,
    listener,
  }: {
    event: string;
    listener: EventListener;
  }): UnsubscribeFunction {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }

    this.eventListeners[event].push(listener);

    // 返回取消监听的函数
    return () => {
      this.off({ event, listener });
    };
  }

  /**
   * @name 监听事件一次
   */
  once({
    event,
    listener,
  }: {
    event: string;
    listener: EventListener;
  }): UnsubscribeFunction {
    const onceListener: EventListener = (...args) => {
      listener(...args);
      this.off({ event, listener: onceListener });
    };

    return this.on({ event, listener: onceListener });
  }

  /**
   * @name 取消监听事件
   */
  off({
    event,
    listener,
  }: {
    event: string;
    listener?: EventListener;
  }): void {
    if (!this.eventListeners[event]) {
      return;
    }

    if (!listener) {
      // 移除该事件的所有监听器
      delete this.eventListeners[event];
      return;
    }

    const index = this.eventListeners[event].indexOf(listener);
    if (index > -1) {
      this.eventListeners[event].splice(index, 1);
    }

    // 如果没有监听器了，删除事件
    if (this.eventListeners[event].length === 0) {
      delete this.eventListeners[event];
    }
  }

  /**
   * @name 获取事件监听器数量
   */
  getListenerCount(event: string): number {
    return this.eventListeners[event]?.length || 0;
  }

  /**
   * @name 获取所有事件名称
   */
  getEventNames(): string[] {
    return Object.keys(this.eventListeners);
  }

  /**
   * @name 检查是否有监听器
   */
  hasListeners(event: string): boolean {
    return this.getListenerCount(event) > 0;
  }

  /**
   * @name 清空所有事件监听器
   */
  removeAllListeners(): void {
    this.eventListeners = {};
  }

  /**
   * @name 清空指定事件的所有监听器
   */
  removeAllListenersForEvent(event: string): void {
    delete this.eventListeners[event];
  }

  /**
   * @name 获取事件系统状态
   */
  getStatus(): {
    totalEvents: number;
    totalListeners: number;
    events: Record<string, number>;
  } {
    const events = this.getEventNames();
    const totalListeners = events.reduce(
      (sum, event) => sum + this.getListenerCount(event),
      0,
    );

    const eventCounts: Record<string, number> = {};
    events.forEach((event) => {
      eventCounts[event] = this.getListenerCount(event);
    });

    return {
      totalEvents: events.length,
      totalListeners,
      events: eventCounts,
    };
  }
}
