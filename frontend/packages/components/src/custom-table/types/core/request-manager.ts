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
 * 请求管理相关类型定义
 * 基于 pro-components 的请求取消机制
 *

 * @date 2025-12-19
 */

/**
 * @name 请求管理器接口
 * @description 管理表格的 HTTP 请求生命周期
 */
export interface RequestManager {
  /** @name 当前活跃的 AbortController */
  currentController?: AbortController;

  /** @name 取消当前进行中的请求 */
  abort: () => void;

  /** @name 创建新的请求控制器 */
  createController: () => AbortController;

  /** @name 检查请求是否已被取消 */
  isAborted: () => boolean;
}

/**
 * @name 创建请求管理器
 * @description 工厂函数，创建一个新的请求管理器实例
 */
export function createRequestManager(): RequestManager {
  let currentController: AbortController | undefined;

  return {
    get currentController() {
      return currentController;
    },

    abort() {
      if (currentController && !currentController.signal.aborted) {
        currentController.abort();
      }
    },

    createController() {
      // 取消之前的请求
      this.abort();

      // 创建新的控制器
      currentController = new AbortController();
      return currentController;
    },

    isAborted() {
      return currentController?.signal.aborted ?? false;
    },
  };
}
